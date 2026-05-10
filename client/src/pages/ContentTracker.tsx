/**
 * LFF Content Tracker — hidden page at /content-tracker
 * Ported from standalone PWA. Uses localStorage for persistence.
 */
import { useEffect, useRef, useState, useCallback } from "react";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663408040383/TeiTyUgvfabHNSBnznn263/LFFNEWLOGOCREAM_transparent_a5b72c81.png";

// ─── Types ────────────────────────────────────────────────────────────────────
type ColKey = "ideas" | "drafting" | "scheduled" | "posted";
type TypeKey = "reel" | "post" | "story" | "carousel";

interface Card {
  id: string;
  title: string;
  type: TypeKey;
  col: ColKey;
  notes: string;
  sched: string;
  ts: number;
}

const STORAGE_KEY = "lff_ideas_v1";

const COLS: Record<ColKey, { label: string; emptyIcon: string; emptyH: string; emptyP: string }> = {
  ideas:     { label: "Ideas",     emptyIcon: "💭", emptyH: "No ideas yet",       emptyP: "Use the bar above or + to add one" },
  drafting:  { label: "Drafting",  emptyIcon: "✍️", emptyH: "Nothing drafting",   emptyP: "Move an idea here when you start writing" },
  scheduled: { label: "Scheduled", emptyIcon: "📅", emptyH: "Nothing scheduled",  emptyP: "Move content here when it's ready to go" },
  posted:    { label: "Posted",    emptyIcon: "🎉", emptyH: "Nothing posted yet", emptyP: "Your wins will show up here" },
};

const COL_EMOJI: Record<ColKey, string> = {
  ideas: "💡", drafting: "✍️", scheduled: "📅", posted: "✅",
};

const TYPES: Record<TypeKey, { label: string; emoji: string; color: string }> = {
  reel:     { label: "Reel",     emoji: "🎬", color: "#C97020" },
  post:     { label: "Post",     emoji: "🖼️", color: "#3A7FA8" },
  story:    { label: "Story",    emoji: "⭕", color: "#9040A0" },
  carousel: { label: "Carousel", emoji: "🎠", color: "#2A8A50" },
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function relDate(ts: number) {
  const d = Date.now() - ts;
  if (d < 86400000) return "Today";
  if (d < 172800000) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function ContentTracker() {
  const [cards, setCards] = useState<Card[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [activeCol, setActiveCol] = useState<ColKey>("ideas");
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCardId, setSheetCardId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [selType, setSelType] = useState<TypeKey>("reel");
  const [selStage, setSelStage] = useState<ColKey>("ideas");
  const [fTitle, setFTitle] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fDate, setFDate] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [qcValue, setQcValue] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    if (modalOpen) setTimeout(() => titleRef.current?.focus(), 350);
  }, [modalOpen]);

  const saveCard = useCallback(() => {
    const title = fTitle.trim();
    if (!title) { setTitleError(true); titleRef.current?.focus(); return; }
    setTitleError(false);
    const notes = fNotes.trim();
    const sched = selStage === "scheduled" ? fDate : "";
    if (editId) {
      setCards(prev => prev.map(c => c.id === editId ? { ...c, title, type: selType, col: selStage, notes, sched } : c));
    } else {
      setCards(prev => [...prev, { id: uid(), title, type: selType, col: selStage, notes, sched, ts: Date.now() }]);
    }
    setModalOpen(false);
    if (window.innerWidth < 768) setActiveCol(selStage);
  }, [fTitle, fNotes, fDate, selType, selStage, editId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setModalOpen(false); setSheetOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && modalOpen) saveCard();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalOpen, saveCard]);

  const counts = (Object.keys(COLS) as ColKey[]).reduce((acc, col) => {
    acc[col] = cards.filter(c => c.col === col).length;
    return acc;
  }, {} as Record<ColKey, number>);

  const quickCapture = () => {
    const title = qcValue.trim();
    if (!title) return;
    setCards(prev => [...prev, { id: uid(), title, type: "reel", col: "ideas", notes: "", sched: "", ts: Date.now() }]);
    setQcValue("");
    if (window.innerWidth < 768) setActiveCol("ideas");
  };

  const openNew = useCallback((defaultStage?: ColKey) => {
    setEditId(null); setSelType("reel"); setSelStage(defaultStage || activeCol);
    setFTitle(""); setFNotes(""); setFDate(""); setTitleError(false);
    setModalOpen(true);
  }, [activeCol]);

  const openEdit = useCallback((id: string) => {
    const c = cards.find(x => x.id === id);
    if (!c) return;
    setEditId(id); setSelType(c.type); setSelStage(c.col);
    setFTitle(c.title); setFNotes(c.notes || ""); setFDate(c.sched || "");
    setTitleError(false); setModalOpen(true);
  }, [cards]);

  const deleteCard = () => {
    if (!editId || !confirm("Delete this idea?")) return;
    setCards(prev => prev.filter(c => c.id !== editId));
    setModalOpen(false);
  };

  const moveTo = (col: ColKey) => {
    if (!sheetCardId) return;
    setCards(prev => prev.map(c => c.id === sheetCardId ? { ...c, col } : c));
    setSheetOpen(false); setSheetCardId(null);
    if (window.innerWidth < 768) setActiveCol(col);
  };

  const colKeys = Object.keys(COLS) as ColKey[];
  const typeKeys = Object.keys(TYPES) as TypeKey[];

  return (
    <>
      <style>{`
        .ct-wrap { display:flex; flex-direction:column; height:100dvh; background:#EAE6D2; color:#2A1F15; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',sans-serif; overflow:hidden; }
        .ct-col { display:none; flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:14px; padding-bottom:max(80px,calc(20px + env(safe-area-inset-bottom))); }
        .ct-col.active { display:block; }
        .ct-card { background:#fff; border-radius:12px; padding:13px 14px; margin-bottom:10px; box-shadow:0 1px 4px rgba(84,65,47,0.1),0 0 0 1px rgba(84,65,47,0.04); cursor:pointer; transition:transform 0.1s; }
        .ct-card:active { transform:scale(0.98); }
        .ct-movebtn { width:28px; height:28px; border-radius:8px; border:none; background:#EAE6D2; color:#8A7060; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ct-typebtn { padding:10px 6px; border-radius:10px; cursor:pointer; text-align:center; font-size:12px; font-weight:700; transition:all 0.1s; }
        .ct-stagebtn { padding:10px 12px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:700; transition:all 0.1s; border:2px solid #D4CEBA; }
        .ct-input { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #D4CEBA; background:#fff; font-size:15px; color:#2A1F15; outline:none; font-family:inherit; }
        .ct-input:focus { border-color:#54412F; }
        .ct-textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #D4CEBA; background:#fff; font-size:14px; color:#2A1F15; outline:none; font-family:inherit; resize:vertical; }
        .ct-textarea:focus { border-color:#54412F; }
        .ct-btn { padding:13px; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; border:none; }
        .ct-tabs { display:flex; background:#D4CEBA; padding:8px 10px; gap:6px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; flex-shrink:0; }
        .ct-tabs::-webkit-scrollbar { display:none; }
        .ct-tab { display:flex; align-items:center; gap:5px; padding:7px 14px; border-radius:20px; border:none; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; font-family:inherit; transition:all 0.15s; }
        .ct-badge { font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 4px; }
        @media(min-width:768px){
          .ct-tabs { display:none !important; }
          .ct-board { display:flex !important; }
          .ct-col { display:flex !important; flex-direction:column; border-right:1px solid #D4CEBA; }
          .ct-col:last-child { border-right:none; }
          .ct-col-hdr { display:flex !important; }
        }
      `}</style>

      <div className="ct-wrap">

        {/* HEADER */}
        <div style={{ background:"#54412F", color:"#EAE6D2", padding:"12px 16px", paddingTop:"max(12px,env(safe-area-inset-top))", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <img src={LOGO} alt="LFF" style={{ height:38, width:38, objectFit:"contain", flexShrink:0 }} />
          <span style={{ fontSize:11, opacity:0.65, letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700 }}>Content Tracker</span>
          {/* Quick capture */}
          <div style={{ display:"flex", flex:1, maxWidth:360, background:"rgba(255,255,255,0.13)", borderRadius:10, overflow:"hidden", marginLeft:"auto" }}>
            <input
              value={qcValue}
              onChange={e => setQcValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && quickCapture()}
              placeholder="Quick capture idea..."
              style={{ flex:1, background:"transparent", border:"none", padding:"9px 12px", fontSize:14, color:"#EAE6D2", outline:"none", fontFamily:"inherit" }}
            />
            <button onClick={quickCapture} style={{ background:"#EAE6D2", color:"#54412F", border:"none", padding:"0 16px", fontSize:20, fontWeight:700, cursor:"pointer", lineHeight:1 }}>+</button>
          </div>
        </div>

        {/* STATS BAR */}
        <div style={{ background:"#3A2D20", color:"#EAE6D2", display:"flex", flexShrink:0 }}>
          {colKeys.map((col, i) => (
            <div key={col} onClick={() => setActiveCol(col)} style={{ flex:1, textAlign:"center", padding:"8px 6px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none", cursor:"pointer" }}>
              <div style={{ fontSize:22, fontWeight:800, lineHeight:1 }}>{counts[col]}</div>
              <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em", opacity:0.6, marginTop:2 }}>{COL_EMOJI[col]}</div>
            </div>
          ))}
        </div>

        {/* COLUMN TABS (mobile) */}
        <div className="ct-tabs">
          {colKeys.map(col => (
            <button key={col} onClick={() => setActiveCol(col)} className="ct-tab" style={{ background: activeCol === col ? "#54412F" : "transparent", color: activeCol === col ? "#EAE6D2" : "#8A7060" }}>
              {COL_EMOJI[col]} {COLS[col].label}
              <span className="ct-badge" style={{ background: activeCol === col ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.15)", color: activeCol === col ? "#EAE6D2" : "#2A1F15" }}>{counts[col]}</span>
            </button>
          ))}
        </div>

        {/* BOARD */}
        <div className="ct-board" style={{ flex:1, overflow:"hidden" }}>
          {colKeys.map(col => {
            const colCards = cards.filter(c => c.col === col).sort((a, b) => b.ts - a.ts);
            return (
              <div key={col} className={`ct-col${activeCol === col ? " active" : ""}`}>
                {/* Desktop header */}
                <div className="ct-col-hdr" style={{ display:"none", alignItems:"center", justifyContent:"space-between", padding:"14px 0 12px", flexShrink:0, borderBottom:"2px solid #D4CEBA", marginBottom:12 }}>
                  <span style={{ fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em", color:"#8A7060" }}>
                    {COL_EMOJI[col]} {COLS[col].label}
                  </span>
                  <span style={{ background:"#54412F", color:"#EAE6D2", fontSize:11, fontWeight:700, minWidth:22, height:22, borderRadius:11, display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0 5px" }}>{counts[col]}</span>
                </div>

                <div style={{ flex:1 }}>
                  {colCards.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"40px 20px", color:"#8A7060" }}>
                      <div style={{ fontSize:36, marginBottom:10 }}>{COLS[col].emptyIcon}</div>
                      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{COLS[col].emptyH}</div>
                      <div style={{ fontSize:13 }}>{COLS[col].emptyP}</div>
                    </div>
                  ) : colCards.map(card => (
                    <div key={card.id} className="ct-card" onClick={() => openEdit(card.id)} style={{ borderLeft:`4px solid ${TYPES[card.type].color}` }}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:7 }}>
                        <div style={{ flex:1, fontSize:15, fontWeight:700, lineHeight:1.3, color:"#2A1F15" }}>{card.title}</div>
                        <button className="ct-movebtn" onClick={e => { e.stopPropagation(); setSheetCardId(card.id); setSheetOpen(true); }}>→</button>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", padding:"2px 8px", borderRadius:4, color:"#fff", background:TYPES[card.type].color }}>
                          {TYPES[card.type].emoji} {TYPES[card.type].label}
                        </span>
                        <span style={{ fontSize:11, color:"#8A7060" }}>{relDate(card.ts)}</span>
                      </div>
                      {card.notes && (
                        <div style={{ marginTop:8, fontSize:13, color:"#8A7060", lineHeight:1.45, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{card.notes}</div>
                      )}
                      {card.sched && (
                        <div style={{ marginTop:6, fontSize:11, color:"#3A7FA8", fontWeight:600 }}>📅 {card.sched}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAB */}
        <button onClick={() => openNew()} style={{ position:"fixed", bottom:"max(22px,calc(18px + env(safe-area-inset-bottom)))", right:18, width:54, height:54, borderRadius:27, background:"#54412F", color:"#EAE6D2", border:"none", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(84,65,47,0.45)", cursor:"pointer", zIndex:100, lineHeight:1 }}>+</button>

        {/* MODAL */}
        <div
          id="ct-overlay"
          onClick={e => { if ((e.target as HTMLElement).id === "ct-overlay") setModalOpen(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(42,31,21,0.55)", zIndex:200, display:"flex", alignItems:"flex-end", opacity: modalOpen ? 1 : 0, pointerEvents: modalOpen ? "all" : "none", transition:"opacity 0.22s" }}
        >
          <div style={{ background:"#F5F2EA", width:"100%", borderRadius:"22px 22px 0 0", padding:"20px 18px", paddingBottom:"max(30px,calc(20px + env(safe-area-inset-bottom)))", transform: modalOpen ? "translateY(0)" : "translateY(100%)", transition:"transform 0.3s cubic-bezier(0.32,0.72,0,1)", maxHeight:"92dvh", overflowY:"auto" }}>
            <div style={{ width:36, height:4, background:"#D4CEBA", borderRadius:2, margin:"0 auto 16px" }} />
            <h2 style={{ fontSize:20, fontWeight:800, color:"#2A1F15", marginBottom:20 }}>{editId ? "Edit Idea ✏️" : "New Idea 💡"}</h2>

            {/* Title */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"#8A7060", marginBottom:6 }}>Title *</label>
              <input ref={titleRef} value={fTitle} onChange={e => { setFTitle(e.target.value); setTitleError(false); }} placeholder="What's the idea?" className="ct-input" style={{ borderColor: titleError ? "#dc3545" : undefined }} />
            </div>

            {/* Type */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"#8A7060", marginBottom:6 }}>Type</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {typeKeys.map(t => (
                  <div key={t} onClick={() => setSelType(t)} className="ct-typebtn" style={{ border:`2px solid ${selType === t ? TYPES[t].color : "#D4CEBA"}`, background: selType === t ? TYPES[t].color : "#fff", color: selType === t ? "#fff" : "#8A7060" }}>
                    <div style={{ fontSize:22, marginBottom:3 }}>{TYPES[t].emoji}</div>
                    {TYPES[t].label}
                  </div>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"#8A7060", marginBottom:6 }}>Stage</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {colKeys.map(s => (
                  <div key={s} onClick={() => setSelStage(s)} className="ct-stagebtn" style={{ background: selStage === s ? "#54412F" : "#fff", color: selStage === s ? "#EAE6D2" : "#8A7060", borderColor: selStage === s ? "#54412F" : "#D4CEBA", cursor:"pointer" }}>
                    {COL_EMOJI[s]} {COLS[s].label}
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled date */}
            {selStage === "scheduled" && (
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"#8A7060", marginBottom:6 }}>Scheduled Date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="ct-input" />
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:"#8A7060", marginBottom:6 }}>Notes / Hook ideas</label>
              <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} placeholder="Caption ideas, hook, key points..." rows={3} className="ct-textarea" />
            </div>

            {/* Buttons */}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setModalOpen(false)} className="ct-btn" style={{ flex:1, background:"transparent", color:"#8A7060", border:"2px solid #D4CEBA" }}>Cancel</button>
              {editId && <button onClick={deleteCard} className="ct-btn" style={{ padding:"13px 16px", background:"#dc3545", color:"#fff" }}>🗑️</button>}
              <button onClick={saveCard} className="ct-btn" style={{ flex:2, background:"#54412F", color:"#EAE6D2" }}>{editId ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>

        {/* MOVE SHEET */}
        <div onClick={() => { setSheetOpen(false); setSheetCardId(null); }} style={{ position:"fixed", inset:0, background:"rgba(42,31,21,0.45)", zIndex:300, opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? "all" : "none", transition:"opacity 0.2s" }} />
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#F5F2EA", borderRadius:"22px 22px 0 0", padding:"20px 18px", paddingBottom:"max(30px,calc(20px + env(safe-area-inset-bottom)))", zIndex:301, transform: sheetOpen ? "translateY(0)" : "translateY(100%)", transition:"transform 0.3s cubic-bezier(0.32,0.72,0,1)" }}>
          <div style={{ width:36, height:4, background:"#D4CEBA", borderRadius:2, margin:"0 auto 16px" }} />
          <h3 style={{ fontSize:16, fontWeight:800, color:"#2A1F15", marginBottom:14 }}>Move to stage</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {colKeys.map(col => {
              const cur = sheetCardId ? cards.find(c => c.id === sheetCardId)?.col === col : false;
              return (
                <button key={col} onClick={() => moveTo(col)} className="ct-btn" style={{ background: cur ? "#54412F" : "#fff", color: cur ? "#EAE6D2" : "#2A1F15", border:`2px solid ${cur ? "#54412F" : "#D4CEBA"}` }}>
                  {COL_EMOJI[col]} {COLS[col].label} {cur ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
