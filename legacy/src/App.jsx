import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import {
  DOMAINS, FULL_BANK, TOPICS, EXAM_SIZE,
  pickExam, PROVIDERS,
  isCorrect, calcScore, calcTopicStats, calcDomainStats,
  formatTime, scoreColor, loadHistory, saveHistory,
} from "./data";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [qs, setQs] = useState([]);
  const [ci, setCi] = useState(0);
  const [ans, setAns] = useState({});
  const [flags, setFlags] = useState(new Set());
  const [time, setTime] = useState(9000);
  const [done, setDone] = useState(false);
  const [hist, setHist] = useState(() => loadHistory());
  const [nav, setNav] = useState(false);
  const [seed, setSeed] = useState(1);
  const [modal, setModal] = useState(false);
  const [prov, setProv] = useState("claude");
  const [mod, setMod] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [prog, setProg] = useState("");
  const [filter, setFilter] = useState("all");
  const tmr = useRef(null);

  useEffect(() => { saveHistory(hist); }, [hist]);

  useEffect(() => {
    if (screen === "exam" && !done) {
      tmr.current = setInterval(() => setTime(t => {
        if (t <= 1) { clearInterval(tmr.current); return 0; }
        return t - 1;
      }), 1000);
      return () => clearInterval(tmr.current);
    }
  }, [screen, done]);

  useEffect(() => {
    if (time === 0 && screen === "exam" && !done) finish();
  }, [time]);

  const start = useCallback((cq) => {
    const q = cq || pickExam(seed);
    setQs(q); setCi(0); setAns({}); setFlags(new Set());
    setTime(9000); setDone(false); setNav(false); setScreen("exam");
  }, [seed]);

  const finish = useCallback(() => {
    clearInterval(tmr.current);
    setDone(true);
    const s = calcScore(qs, ans);
    const p = Math.round((s / qs.length) * 1000);
    setHist(h => [...h, {
      d: new Date().toISOString(), s, n: qs.length, p,
      pass: p >= 700, t: 9000 - time,
      ts: calcTopicStats(qs, ans), ds: calcDomainStats(qs, ans),
    }]);
    setScreen("results");
  }, [ans, qs, time]);

  const pick = (qId, v, multi) => {
    if (done) return;
    setAns(p => {
      if (multi) {
        const c = p[qId] || [];
        return { ...p, [qId]: c.includes(v) ? c.filter(x => x !== v) : [...c, v] };
      }
      return { ...p, [qId]: v };
    });
  };

  const flag = id => setFlags(p => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const aiGen = async () => {
    if (!key.trim()) { setErr("API key is required"); return; }
    setLoading(true); setErr(""); setProg("Connecting...");
    try {
      const P = PROVIDERS[prov];
      const m = mod || P.default;
      setProg(`Generating via ${P.name} (${m})...`);
      const raw = await P.call(key.trim(), m);
      setProg("Parsing...");
      const match = raw.match(/\[[\s\S]*\]/);
      const parsed = JSON.parse(match ? match[0] : raw);
      if (!Array.isArray(parsed) || parsed.length < 10) throw new Error("Too few questions");
      const v = parsed.slice(0, 55).map((q, i) => ({
        id: 2000 + i, domain: q.domain || 1,
        topic: q.topic || "Azure Functions",
        type: Array.isArray(q.correct) ? "multi" : "single",
        text: q.text || "", options: Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"],
        correct: q.correct ?? 0, explanation: q.explanation || "",
      }));
      setModal(false); setKey(""); start(v);
    } catch (e) { setErr(e.message || "Failed"); }
    finally { setLoading(false); setProg(""); }
  };

  const cnt = qs.filter(q => {
    const a = ans[q.id];
    return a !== undefined && (q.type === "multi" ? a.length > 0 : true);
  }).length;
  const last = hist[hist.length - 1];

  /* ─── AI Modal ─── */
  const AIModal = modal && (
    <div className="modal-overlay" onClick={() => !loading && setModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Generate New Exam with AI</span>
          {!loading && <button className="modal-close" onClick={() => setModal(false)}>✕</button>}
        </div>

        <div className="field">
          <label className="field-label">AI Provider</label>
          <div className="provider-grid">
            {Object.entries(PROVIDERS).map(([k, p]) => (
              <button key={k}
                className={`provider-btn ${prov === k ? "provider-btn--active" : ""}`}
                onClick={() => { setProv(k); setMod(""); setErr(""); }}>
                <span className="provider-icon">{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Model</label>
          <div className="model-grid">
            {PROVIDERS[prov].models.map(m => (
              <button key={m}
                className={`model-btn ${(mod || PROVIDERS[prov].default) === m ? "model-btn--active" : ""}`}
                onClick={() => setMod(m)}>{m}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">API Key</label>
          <input type="password" value={key} onChange={e => setKey(e.target.value)}
            placeholder={`Enter ${PROVIDERS[prov].name} API key`}
            className="input-key" disabled={loading} />
          <div className="input-hint">Used only for this request. Never stored.</div>
        </div>

        {err && <div className="msg-error">{err}</div>}
        {prog && <div className="msg-progress">{prog}</div>}

        <button className="btn-generate" onClick={aiGen} disabled={loading}>
          {loading ? "Generating..." : "Generate 55 Questions"}
        </button>
      </div>
    </div>
  );

  /* ═══ HOME ═══ */
  if (screen === "home") return (
    <div className="app-root">
      {AIModal}
      <div className="mesh-bg" />
      <div className="home-wrap">
        <div className="logo-row">
          <span className="logo-hex">⬡</span>
          <span className="logo-label">AZ-204</span>
        </div>
        <h1 className="home-title">Azure Developer Associate</h1>
        <p className="home-subtitle">Exam Simulator</p>

        <div className="stat-grid">
          {[["55", "Questions"], ["150", "Minutes"], ["700", "Pass Score"], ["5", "Domains"]].map(([v, l]) => (
            <div key={l} className="stat-card">
              <div className="stat-value">{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>

        <div className="glass">
          <div className="section-header">Exam Domains</div>
          {DOMAINS.map(d => (
            <div key={d.name} className="domain-row">
              <span>{d.name}</span>
              <span className="domain-pct" style={{ color: d.color }}>{Math.round(d.weight * 100)}%</span>
            </div>
          ))}
        </div>

        <div className="glass mt-16">
          <div className="section-header">Topics</div>
          <div className="tag-wrap">
            {TOPICS.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-primary" onClick={() => start()}>Start Exam</button>
          <button className="btn-ai" onClick={() => setModal(true)}>
            <span style={{ fontSize: 16 }}>✦</span> AI Generate
          </button>
        </div>

        {hist.length > 0 && (
          <div className="glass mt-24">
            <div className="section-header">History ({hist.length})</div>
            {hist.slice(-8).reverse().map((a, i) => (
              <div key={i} className="hist-row">
                <span className="hist-date">
                  {new Date(a.d).toLocaleDateString()}{" "}
                  {new Date(a.d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="hist-score" style={{ color: scoreColor(a.p) }}>
                  {a.p}/1000 {a.pass ? "✓ PASS" : "✗ FAIL"}
                </span>
              </div>
            ))}
            <button className="btn-secondary w-full mt-16" style={{ padding: 8, fontSize: 12 }}
              onClick={() => setHist([])}>Clear History</button>
          </div>
        )}
      </div>
    </div>
  );

  /* ═══ EXAM ═══ */
  if (screen === "exam") {
    const q = qs[ci];
    if (!q) return null;
    const multi = q.type === "multi";
    const fl = flags.has(q.id);
    const tw = time < 600;

    return (
      <div className="app-root">
        {/* Top bar */}
        <div className="top-bar">
          <div className="bar-left">
            <span className="logo-hex" style={{ fontSize: 20 }}>⬡</span>
            <span className="bar-label">Q {ci + 1}/{qs.length}</span>
          </div>
          <div className="bar-center">
            <div className={`timer ${tw ? "timer-warn" : ""}`}>{formatTime(time)}</div>
          </div>
          <div className="bar-right">
            <span className="bar-muted">{cnt}/{qs.length}</span>
            <button className="nav-toggle" onClick={() => setNav(!nav)}>{nav ? "✕" : "☰"}</button>
          </div>
        </div>

        {/* Nav panel */}
        {nav && (
          <div className="nav-panel">
            <div className="nav-grid">
              {qs.map((q2, i) => {
                const a = ans[q2.id];
                const has = a !== undefined && (q2.type === "multi" ? a.length > 0 : true);
                const fl2 = flags.has(q2.id);
                const cur = i === ci;
                return (
                  <button key={i} className="nav-btn"
                    onClick={() => { setCi(i); setNav(false); }}
                    style={{
                      background: cur ? "#0066FF" : has ? "#0D2818" : "#1A1929",
                      border: fl2 ? "2px solid #FBBF24" : cur ? "2px solid #0066FF" : "2px solid #252340",
                      color: cur ? "#FFF" : has ? "#34D399" : "#A5A0C2",
                    }}>{i + 1}</button>
                );
              })}
            </div>
            <div className="nav-legend">
              <span><span style={{ color: "#34D399" }}>■</span> Answered</span>
              <span><span style={{ color: "#0066FF" }}>■</span> Current</span>
              <span><span style={{ color: "#FBBF24" }}>□</span> Flagged</span>
            </div>
          </div>
        )}

        {/* Question */}
        <div className="exam-body">
          <div className="question-card">
            <div className="question-top">
              <span className="badge">{q.topic}</span>
              <span className="badge domain-badge"
                style={{ background: (DOMAINS[q.domain - 1]?.color || "#888") + "22", color: DOMAINS[q.domain - 1]?.color }}>
                D{q.domain}
              </span>
              <button className={`flag-btn ${fl ? "flag-btn--active" : "flag-btn--inactive"}`}
                onClick={() => flag(q.id)}>
                {fl ? "⚑ Flagged" : "⚐ Flag"}
              </button>
            </div>

            {multi && <div className="multi-hint">Select all that apply</div>}
            <div className="question-text">{q.text}</div>

            <div className="options-wrap">
              {q.options.map((o, i) => {
                const L = String.fromCharCode(65 + i);
                const sel = multi ? (ans[q.id] || []).includes(i) : ans[q.id] === i;
                return (
                  <button key={i}
                    className={`option-btn ${sel ? "option-btn--selected" : ""}`}
                    onClick={() => pick(q.id, i, multi)}>
                    <span className={`option-letter ${sel ? "option-letter--selected" : ""}`}>{L}</span>
                    <span className="option-text">{o}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bottom-nav">
            <button className="btn-secondary" disabled={ci === 0}
              style={{ opacity: ci === 0 ? 0.3 : 1 }}
              onClick={() => setCi(c => c - 1)}>← Previous</button>
            {ci === qs.length - 1
              ? <button className="btn-finish" onClick={finish}>Finish Exam</button>
              : <button className="btn-secondary" onClick={() => setCi(c => c + 1)}>Next →</button>
            }
          </div>
        </div>
      </div>
    );
  }

  /* ═══ RESULTS ═══ */
  if (screen === "results" && last) {
    const domainData = last.ds || calcDomainStats(qs, ans);
    const topicData = last.ts || calcTopicStats(qs, ans);

    return (
      <div className="app-root">
        {AIModal}
        <div className="mesh-bg" />
        <div className="results-wrap">
          <div className="result-header">
            <div className={`result-badge ${last.pass ? "result-badge--pass" : "result-badge--fail"}`}>
              {last.pass ? "PASSED" : "FAILED"}
            </div>
            <div className="result-score" style={{ color: scoreColor(last.p) }}>
              {last.p}<span className="result-max">/1000</span>
            </div>
            <div className="result-info">
              {last.s}/{last.n} correct • {formatTime(last.t)} elapsed • Attempt #{hist.length}
            </div>
          </div>

          {/* Score bar */}
          <div className="score-bar-wrap">
            <div className="score-bar-bg">
              <div className={`score-bar-fill ${last.pass ? "score-bar-fill--pass" : "score-bar-fill--fail"}`}
                style={{ width: `${last.p / 10}%` }} />
              <div className="pass-line" />
            </div>
            <div className="pass-label">700 pass</div>
          </div>

          {/* Domain breakdown */}
          <div className="glass mb-16">
            <div className="section-header">Domain Breakdown</div>
            {Object.entries(domainData).sort((a, b) => (a[1].c / a[1].n) - (b[1].c / b[1].n)).map(([name, d]) => {
              const p = Math.round((d.c / d.n) * 100);
              return (
                <div key={name} className="breakdown-row">
                  <div className="breakdown-header">
                    <span className="breakdown-name">{name}</span>
                    <span className={`breakdown-pct ${p >= 70 ? "color-pass" : p >= 50 ? "color-warn" : "color-fail"}`}>
                      {d.c}/{d.n} ({p}%)
                    </span>
                  </div>
                  <div className="breakdown-bar">
                    <div className="breakdown-bar-fill" style={{ width: `${p}%`, background: d.color, opacity: p >= 70 ? 1 : 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Topic breakdown */}
          <div className="glass mb-24">
            <div className="section-header">Topic Breakdown</div>
            {Object.entries(topicData).filter(([, v]) => v.n > 0)
              .sort((a, b) => (a[1].c / a[1].n) - (b[1].c / b[1].n))
              .map(([t, d]) => {
                const p = Math.round((d.c / d.n) * 100);
                return (
                  <div key={t} className="breakdown-row">
                    <div className="breakdown-header">
                      <span className="breakdown-name--small">{t}</span>
                      <span className={`breakdown-pct breakdown-pct--small ${p >= 70 ? "color-pass" : p >= 50 ? "color-warn" : "color-fail"}`}>
                        {d.c}/{d.n}
                      </span>
                    </div>
                    <div className="breakdown-bar breakdown-bar--small">
                      <div className={`breakdown-bar-fill ${p >= 70 ? "bg-pass" : p >= 50 ? "bg-warn" : "bg-fail"}`}
                        style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn-primary" onClick={() => { setFilter("all"); setScreen("review"); }}>Review Answers</button>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-secondary flex-1" onClick={() => { setSeed(s => s + 1); start(); }}>Retake (Shuffle)</button>
              <button className="btn-ai flex-1" onClick={() => setModal(true)}>
                <span style={{ fontSize: 14 }}>✦</span> AI Generate
              </button>
            </div>
            <button className="btn-secondary" style={{ borderColor: "#78716C" }} onClick={() => setScreen("home")}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══ REVIEW ═══ */
  if (screen === "review") {
    const fqs = filter === "all" ? qs
      : filter === "wrong" ? qs.filter(q => !isCorrect(q, ans[q.id]))
      : qs.filter(q => isCorrect(q, ans[q.id]));

    return (
      <div className="app-root">
        <div className="top-bar">
          <div className="bar-left">
            <span className="logo-hex" style={{ fontSize: 20 }}>⬡</span>
            <span className="bar-label">Review ({fqs.length})</span>
          </div>
          <div className="bar-right">
            <div className="filter-group">
              {["all", "wrong", "correct"].map(f => (
                <button key={f}
                  className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
                  onClick={() => setFilter(f)}>
                  {f === "all" ? "All" : f === "wrong" ? "✗ Wrong" : "✓ Correct"}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setScreen("results")}>← Results</button>
          </div>
        </div>

        <div className="review-body">
          {fqs.map(q => {
            const a = ans[q.id];
            const multi = q.type === "multi";
            const ok = isCorrect(q, a);

            return (
              <div key={q.id} className={`review-card ${ok ? "review-card--correct" : "review-card--wrong"}`}>
                <div className="review-header">
                  <span className="review-qnum">Q{qs.indexOf(q) + 1}</span>
                  <span className="badge">{q.topic}</span>
                  <span className="review-status" style={{ color: ok ? "#34D399" : "#FB7185" }}>
                    {ok ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </div>

                <div className="review-text">{q.text}</div>

                <div className="review-options">
                  {q.options.map((o, i) => {
                    const L = String.fromCharCode(65 + i);
                    const ws = multi ? (a || []).includes(i) : a === i;
                    const ic = multi ? q.correct.includes(i) : q.correct === i;
                    const optClass = ic ? "review-opt--correct" : ws ? "review-opt--wrong" : "";
                    const letterClass = ic ? "review-opt-letter--correct" : ws ? "review-opt-letter--wrong" : "";

                    return (
                      <div key={i} className={`review-opt ${optClass}`}>
                        <span className={`review-opt-letter ${letterClass}`}>{L}</span>
                        <span className="review-opt-text">{o}</span>
                        {ic && <span className="review-opt-tag color-pass">✓ Correct</span>}
                        {ws && !ic && <span className="review-opt-tag color-fail">Your answer</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="explanation">
                  <strong>Explanation: </strong>{q.explanation}
                </div>
              </div>
            );
          })}
          <button className="btn-primary mx-auto mt-24" style={{ display: "block", maxWidth: 300 }}
            onClick={() => setScreen("results")}>Back to Results</button>
        </div>
      </div>
    );
  }

  return null;
}
