import { useState } from "react";
function calcBMR({ gender, age, weightKg, heightCm, bodyFatPct }) {
 if (bodyFatPct && bodyFatPct > 0) {
 const leanMass = weightKg * (1 - bodyFatPct / 100);
 return 370 + 21.6 * leanMass;
 }
 if (gender === "female") return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
 return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

const FREQ_MULTIPLIERS = {
 "3-4x": 1.55,
 "5-6x": 1.725,
};

const WORKOUT_ADJUSTMENTS = {
 rest: { calMult: 0.90, proteinG: 1.8, carbG: 2.0, fatG: 0.9, label: "Rest Day", icon: "◦", carbRange: "2g/kg" },
 strength: { calMult: 1.00, proteinG: 2.2, carbG: 2.75, fatG: 0.9, label: "Strength", icon: "↑", carbRange: "2.5–3g/kg" },
 running: { calMult: 1.08, proteinG: 1.9, carbG: 5.5, fatG: 0.8, label: "Running", icon: "→", carbRange: "5–6g/kg" },
 rowing: { calMult: 1.06, proteinG: 2.0, carbG: 5.5, fatG: 0.8, label: "Rowing", icon: "⟷", carbRange: "5–6g/kg" },
 cardio: { calMult: 1.05, proteinG: 1.9, carbG: 5.5, fatG: 0.8, label: "Cardio", icon: "♡", carbRange: "5–6g/kg" },
};

function calcTargets(profile, workoutType) {
 const bmr = calcBMR(profile);
 const tdee = bmr * (FREQ_MULTIPLIERS[profile.frequency] || 1.55);
 const adj = WORKOUT_ADJUSTMENTS[workoutType] || WORKOUT_ADJUSTMENTS.rest;
 const deficitAmount = profile.goal === "lose" ? (profile.deficit || 400) : 0;
 const calories = Math.round(tdee * adj.calMult - deficitAmount);
 const protein = Math.round(profile.weightKg * adj.proteinG);
 const carbs = Math.round(profile.weightKg * adj.carbG);
 const fat = Math.max(20, Math.round((calories - protein * 4 - carbs * 4) / 9));
 return { calories, protein, carbs, fat, tdee: Math.round(tdee), bmr: Math.round(bmr), deficitAmount };
}

function ftInToCm(ft, inches) { return ft * 30.48 + inches * 2.54; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
const DEFAULT_PROFILE = {
 gender: "female", age: "", weightKg: "",
 heightFt: "5", heightIn: "6", bodyFatPct: "",
 frequency: "3-4x", goal: "maintain", deficit: 400,
 setup: false,
};

function MacroBar({ label, current, target, color, targetPct }) {
 const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0);
 const over = current > target;
 return (
 <div style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
 <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
 <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, letterSpacing: 2.5, textTransform: "uppercase", color: "#B8C8CC" }}>{label}</span>
 <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#8AAAB0" }}>{targetPct}%</span>
 </div>
 <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: over ? "#FF4444" : "#B8C8CC" }}>
 {current}<span style={{ color: "#8AAAB0" }}>/{target}g</span>
 </span>
 </div>
 <div style={{ height: 3, background: "#2A2540", borderRadius: 2, overflow: "hidden" }}>
 <div style={{ height: "100%", width: `${pct}%`, background: over ? "#FF4444" : color, borderRadius: 2, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} />
 </div>
 </div>
 );
}

function WorkoutPicker({ value, onChange }) {
 const types = ["rest","strength","running","rowing","cardio"];
 return (
 <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
 {types.map(t => {
 const adj = WORKOUT_ADJUSTMENTS[t];
 const active = value === t;
 return (
 <button key={t} onClick={() => onChange(t)} style={{ flex: 1, padding: "9px 0 8px", border: "1px solid " + (active ? "#17C0DE" : "#2A2540"), borderRadius: 8, cursor: "pointer", background: active ? "#0A1E28" : "#161320", color: active ? "#17C0DE" : "#8AAAB0", fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", transition: "all 0.15s", }}>
 <div style={{ fontSize: 15, marginBottom: 3 }}>{adj.icon}</div>
 {adj.label.split(" ")[0]}
 </button>
 );
 })}
 </div>
 );
}

function FoodLog({ entries, onAdd, onDelete }) {
 const [open, setOpen] = useState(false);
 const [f, setF] = useState({ name:"", cals:"", protein:"", carbs:"", fat:"" });
 const inp = (field) => ({
 type: field === "name" ? "text" : "number",
 placeholder: field === "name" ? "Food name" : field === "cals" ? "kcal" : field+" (g)",
 value: f[field],
 onChange: e => setF(p => ({...p, [field]: e.target.value})),
 style: {
 background:"#0C0A18", border:"1px solid #222", borderRadius:7,
 color:"#F2F6F6", padding:"10px 12px", fontSize:14,
 fontFamily:"'DM Mono',monospace", outline:"none", width:"100%", boxSizing:"border-box"
 }
 });
 const submit = () => {
 if (!f.name || !f.cals) return;
 onAdd({ name:f.name, cals:+f.cals, protein:+f.protein||0, carbs:+f.carbs||0, fat:+f.fat||0 });
 setF({ name:"", cals:"", protein:"", carbs:"", fat:"" });
 setOpen(false);
 };
 return (
 <div>
 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
 <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:3, color:"#8AAAB0", textTransform:"uppercase" }}>Food Log</span>
 <button onClick={() => setOpen(o => !o)} style={{ background: open ? "#181828" : "#17C0DE", color: open ? "#8AAAB0" : "#0E0C14", border:"none", borderRadius:6, padding:"6px 14px", cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:1.5, textTransform:"uppercase", fontWeight:700 }}>{open ? "Cancel" : "+ Add"}</button>
 </div>
 {open && (
 <div style={{ background:"#1C1828", border:"1px solid #1c1c1c", borderRadius:10, padding:14, marginBottom:10 }}>
 <div style={{ marginBottom:8 }}><input {...inp("name")} /></div>
 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
 <input {...inp("cals")} />
 <input {...inp("protein")} />
 <input {...inp("carbs")} />
 <input {...inp("fat")} />
 </div>
 <button onClick={submit} style={{ width:"100%", padding:"12px", background:"#17C0DE", color:"#0E0C14", border:"none", borderRadius:7, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, letterSpacing:2, textTransform:"uppercase" }}>Log It</button>
 </div>
 )}
 {entries.length === 0 && !open && (
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#8AAAB0", textAlign:"center", padding:"20px 0" }}>nothing logged yet</div>
 )}
 {entries.map((e, i) => (
 <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#0C0A18", borderRadius:8, padding:"10px 14px", marginBottom:5, border:"1px solid #181818" }}>
 <div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, color:"#B8C8CC" }}>{e.name}</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8AAAB0", marginTop:2 }}>P{e.protein} · C{e.carbs} · F{e.fat}</div>
 </div>
 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
 <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, color:"#B8C8CC", fontWeight:600 }}>{e.cals}</span>
 <button onClick={() => onDelete(i)} style={{ background:"none", border:"none", color:"#8AAAB0", cursor:"pointer", fontSize:18, padding:0, lineHeight:1 }}>×</button>
 </div>
 </div>
 ))}
 </div>
 );
}

function ProfileSetup({ profile, onChange, onSave }) {
 const inp = (label, field, placeholder, type="text") => (
 <div>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:6, display:"block" }}>{label}</label>
 <input type={type} placeholder={placeholder} value={profile[field]} onChange={e => onChange(field, e.target.value)}
 style={{ background:"#0C0A18", border:"1px solid #222", borderRadius:8, color:"#F2F6F6", padding:"12px 14px", fontSize:15, fontFamily:"'DM Mono',monospace", outline:"none", width:"100%", boxSizing:"border-box" }} />
 </div>
 );
 const canSave = profile.age && profile.weightKg;
 return (
 <div style={{ paddingBottom:40 }}>
 <div style={{ marginBottom:28, paddingBottom:18, borderBottom:"1px solid #181818" }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:3, color:"#8AAAB0", textTransform:"uppercase", marginBottom:4 }}>Setup</div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:700, color:"#F2F6F6", letterSpacing:-0.5 }}>Your Profile</div>
 </div>
 {}
 <div style={{ marginBottom:16 }}>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8, display:"block" }}>Biological Sex</label>
 <div style={{ display:"flex", gap:10 }}>
 {["female","male"].map(g => (
 <button key={g} onClick={() => onChange("gender",g)} style={{ flex:1, padding:"12px", borderRadius:8, cursor:"pointer", border:"1px solid " + (profile.gender===g ? "#17C0DE" : "#2A2540"), background: profile.gender===g ? "#0A1E28" : "#161320", color: profile.gender===g ? "#17C0DE" : "#8AAAB0", fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, letterSpacing:2, textTransform:"uppercase" }}>{g}</button>
 ))}
 </div>
 </div>
 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
 {inp("Age","age","30","number")}
 {inp("Weight (kg)","weightKg","65","number")}
 </div>
 {}
 <div style={{ marginBottom:16 }}>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8, display:"block" }}>Height</label>
 <div style={{ display:"flex", gap:10 }}>
 {[["heightFt",[4,5,6,7],"ft"],["heightIn",[0,1,2,3,4,5,6,7,8,9,10,11],"in"]].map(([field,opts,unit]) => (
 <select key={field} value={profile[field]} onChange={e => onChange(field, e.target.value)} style={{ flex:1, background:"#0C0A18", border:"1px solid #222", borderRadius:8, color:"#F2F6F6", padding:"12px 14px", fontSize:15, fontFamily:"'DM Mono',monospace", outline:"none", appearance:"none" }}>
 {opts.map(v => <option key={v} value={v}>{v} {unit}</option>)}
 </select>
 ))}
 </div>
 </div>
 <div style={{ marginBottom:20 }}>
 {inp("Body Fat % (optional)","bodyFatPct","e.g. 22","number")}
 </div>
 {}
 <div style={{ marginBottom:28 }}>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8, display:"block" }}>Weekly Training Frequency</label>
 <div style={{ display:"flex", gap:10 }}>
 {[
 { key:"3-4x", title:"3–4× / week", sub:"Moderate", note:"Activity ×1.55" },
 { key:"5-6x", title:"5–6× / week", sub:"High", note:"Activity ×1.725" },
 ].map(f => (
 <button key={f.key} onClick={() => onChange("frequency",f.key)} style={{ flex:1, padding:"14px 10px", borderRadius:9, cursor:"pointer", textAlign:"center", border:"1px solid " + (profile.frequency===f.key ? "#17C0DE" : "#2A2540"), background: profile.frequency===f.key ? "#0A1E28" : "#161320", }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color: profile.frequency===f.key ? "#17C0DE" : "#8AAAB0", letterSpacing:0.5 }}>{f.title}</div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2, textTransform:"uppercase", color: profile.frequency===f.key ? "#0F9AB8" : "#8AAAB0", marginTop:3 }}>{f.sub}</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8AAAB0", marginTop:4 }}>{f.note}</div>
 </button>
 ))}
 </div>
 </div>
 {}
 <div style={{ marginBottom:20 }}>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8, display:"block" }}>Goal</label>
 <div style={{ display:"flex", gap:10 }}>
 {[
 { key:"maintain", label:"Maintain Weight", sub:"eat at TDEE" },
 { key:"lose", label:"Lose Weight", sub:"calorie deficit" },
 ].map(g => (
 <button key={g.key} onClick={() => onChange("goal", g.key)} style={{ flex:1, padding:"14px 10px", borderRadius:9, cursor:"pointer", textAlign:"center", border:"1px solid " + (profile.goal===g.key ? "#17C0DE" : "#2A2540"), background: profile.goal===g.key ? "#0A1E28" : "#161320", }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: profile.goal===g.key ? "#17C0DE" : "#8AAAB0", letterSpacing:0.5 }}>{g.label}</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color: profile.goal===g.key ? "#0F9AB8" : "#8AAAB0", marginTop:4 }}>{g.sub}</div>
 </button>
 ))}
 </div>
 </div>
 {}
 {profile.goal === "lose" && (
 <div style={{ marginBottom:24 }}>
 <label style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:2.5, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8, display:"block" }}>
 Daily Deficit
 </label>
 <div style={{ display:"flex", gap:8 }}>
 {[300, 400, 500].map(d => (
 <button key={d} onClick={() => onChange("deficit", d)} style={{ flex:1, padding:"12px 0", borderRadius:8, cursor:"pointer", textAlign:"center", border:"1px solid " + ((profile.deficit||400)===d ? "#17C0DE" : "#2A2540"), background: (profile.deficit||400)===d ? "#0A1E28" : "#161320", color: (profile.deficit||400)===d ? "#17C0DE" : "#8AAAB0", fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, letterSpacing:0.5, }}>
 −{d}
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:(profile.deficit||400)===d ? "#0F9AB8" : "#8AAAB0", marginTop:3 }}>kcal/day</div>
 </button>
 ))}
 </div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8AAAB0", marginTop:10, textAlign:"center" }}>
 ~{Math.round((profile.deficit||400) * 7 / 7700 * 10) / 10} kg/week estimated loss
 </div>
 </div>
 )}
 <button onClick={onSave} disabled={!canSave} style={{ width:"100%", padding:"15px", background: canSave ? "#17C0DE" : "#181828", color: canSave ? "#0E0C14" : "#8AAAB0", border:"none", borderRadius:10, cursor: canSave ? "pointer" : "default", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>Calculate My Targets →</button>
 </div>
 );
}

export default function App() {
 const [profile, setProfile] = useState(DEFAULT_PROFILE);
 const [workoutType, setWorkoutType] = useState("strength");
 const [log, setLog] = useState({});
 const [view, setView] = useState("track");
 const todayKey = todayStr();
 const entries = log[todayKey] || [];
 const weightKg = +profile.weightKg || 70;
 const heightCm = ftInToCm(+profile.heightFt || 5, +profile.heightIn || 6);
 const calc = { ...profile, weightKg, heightCm, age: +profile.age || 30 };
 const targets = calcTargets(calc, workoutType);
 const totals = entries.reduce((a, e) => ({
 cals: a.cals + e.cals, protein: a.protein + e.protein,
 carbs: a.carbs + e.carbs, fat: a.fat + e.fat,
 }), { cals:0, protein:0, carbs:0, fat:0 });
 const remaining = targets.calories - totals.cals;
 const over = remaining < 0;
 const adj = WORKOUT_ADJUSTMENTS[workoutType];
 return (
 <div style={{ minHeight:"100vh", background:"#0E0C14", color:"#F2F6F6", display:"flex", justifyContent:"center" }}>
 <link href="https:
 <div style={{ width:"100%", maxWidth:430, padding:"0 16px" }}>
 {}
 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0 14px", borderBottom:"1px solid #141414", marginBottom:18 }}>
 <div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:700, letterSpacing:2, color:"#F2F6F6", textTransform:"uppercase" }}>
 FUEL<span style={{ color:"#17C0DE" }}>OS</span>
 </div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#6A8C94", marginTop:1 }}>
 {new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}).toUpperCase()}
 </div>
 </div>
 <div style={{ display:"flex", gap:6 }}>
 {[{k:"track",l:"Track"},{k:"setup",l:"Profile"}].map(t => (
 <button key={t.k} onClick={() => setView(t.k)} style={{ padding:"7px 14px", border:"none", borderRadius:6, cursor:"pointer", background: view===t.k ? "#181828" : "transparent", color: view===t.k ? "#17C0DE" : "#8AAAB0", fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:1.5, textTransform:"uppercase" }}>{t.l}</button>
 ))}
 </div>
 </div>
 {}
 {view === "setup" && (
 <ProfileSetup profile={profile} onChange={(f,v) => setProfile(p=>({...p,[f]:v}))} onSave={() => { setProfile(p=>({...p,setup:true})); setView("track"); }} />
 )}
 {}
 {view === "track" && !profile.setup && (
 <div style={{ textAlign:"center", padding:"70px 0" }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, color:"#8AAAB0", marginBottom:6 }}>Set up your profile first</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#8AAAB0", marginBottom:24 }}>takes 30 seconds</div>
 <button onClick={() => setView("setup")} style={{ background:"#17C0DE", color:"#0E0C14", border:"none", borderRadius:8, padding:"14px 32px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer" }}>Get Started →</button>
 </div>
 )}
 {}
 {view === "track" && profile.setup && (
 <>
 {}
 <div style={{ display:"flex", gap:0, marginBottom:18, background:"#161320", borderRadius:10, overflow:"hidden", border:"1px solid #181818" }}>
 {[
 { label:"BMR", value: targets.bmr+"" },
 { label:"TDEE", value: targets.tdee+"" },
 { label:"Freq", value: profile.frequency==="5-6x" ? "5–6×/wk" : "3–4×/wk", small:true },
 ].map((s,i) => (
 <div key={i} style={{ flex:1, padding:"12px 6px", textAlign:"center", borderRight: i<2 ? "1px solid #181818":"none" }}>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize: s.small?12:17, color:"#B8C8CC" }}>{s.value}</div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, color:"#8AAAB0", textTransform:"uppercase", marginTop:2 }}>{s.label}</div>
 </div>
 ))}
 </div>
 {}
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:3, color:"#8AAAB0", textTransform:"uppercase", marginBottom:8 }}>Today's Session</div>
 <WorkoutPicker value={workoutType} onChange={setWorkoutType} />
 {}
 <div style={{ background:"#0C0A18", border:"1px solid #1a1a1a", borderRadius:10, padding:"14px 16px", marginBottom:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
 <div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, color:"#17C0DE", letterSpacing:0.5 }}>{adj.label} Day</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8AAAB0", marginTop:3 }}>
 {profile.frequency==="5-6x" ? "High frequency" : "Moderate frequency"} · {profile.goal==="lose" ? "fat loss" : "recomp"}
 </div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4ECDC4", marginTop:2 }}>
 carbs {adj.carbRange}
 </div>
 {profile.goal === "lose" && (
 <div style={{ display:"inline-block", marginTop:6, background:"#2A1408", border:"1px solid #5a2a00", borderRadius:4, padding:"2px 8px" }}>
 <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:1.5, color:"#FF7A3A", textTransform:"uppercase" }}>−{targets.deficitAmount} kcal deficit</span>
 </div>
 )}
 </div>
 <div style={{ textAlign:"right" }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:32, fontWeight:700, color:"#F2F6F6", lineHeight:1 }}>{targets.calories}</div>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8AAAB0", marginTop:2 }}>kcal target</div>
 </div>
 </div>
 {}
 <div style={{ textAlign:"center", padding:"22px 0 18px", borderBottom:"1px solid #141414", marginBottom:18 }}>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:3, color:"#8AAAB0", marginBottom:6, textTransform:"uppercase" }}>Calories Remaining</div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:76, fontWeight:700, lineHeight:1, color: over ? "#FF4444" : "#F2F6F6", letterSpacing:-3 }}>
 {Math.abs(remaining)}
 </div>
 {over && <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:3, color:"#FF4444", marginTop:4, textTransform:"uppercase" }}>over target</div>}
 <div style={{ display:"flex", justifyContent:"center", gap:30, marginTop:14 }}>
 {[{l:"eaten",v:totals.cals},{l:"target",v:targets.calories}].map((x,i) => (
 <div key={i} style={{ textAlign:"center" }}>
 <div style={{ fontFamily:"'DM Mono',monospace", fontSize:17, color:"#B8C8CC" }}>{x.v}</div>
 <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:2, color:"#8AAAB0", textTransform:"uppercase", marginTop:2 }}>{x.l}</div>
 </div>
 ))}
 </div>
 </div>
 {}
 <div style={{ marginBottom:22 }}>
 {(() => {
 const totalCals = targets.protein * 4 + targets.carbs * 4 + targets.fat * 9;
 const protPct = Math.round(targets.protein * 4 / totalCals * 100);
 const carbPct = Math.round(targets.carbs * 4 / totalCals * 100);
 const fatPct = 100 - protPct - carbPct;
 return (<>
 <MacroBar label="Protein" current={totals.protein} target={targets.protein} color="#17C0DE" targetPct={protPct} />
 <MacroBar label="Carbs" current={totals.carbs} target={targets.carbs} color="#4ECDC4" targetPct={carbPct} />
 <MacroBar label="Fat" current={totals.fat} target={targets.fat} color="#FFB830" targetPct={fatPct} />
 </>);
 })()}
 </div>
 {}
 <FoodLog entries={entries} onAdd={e => setLog(l => ({...l,[todayKey]:[...(l[todayKey]||[]),e]}))} onDelete={i => setLog(l => ({...l,[todayKey]:(l[todayKey]||[]).filter((_,j)=>j!==i)}))} />
 <div style={{ height:40 }} />
 </>
 )}
 </div>
 </div>
 );
}
