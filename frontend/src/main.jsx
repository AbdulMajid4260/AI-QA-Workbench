import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Code2,
  Download,
  FileText,
  FlaskConical,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LoaderCircle,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Upload,
  X,
  XCircle,
  ExternalLink,
  Bug,
  Database,
  Layers,
  Terminal,
  Link as LinkIcon,
} from "lucide-react";
import "./style.css";

const EMPTY = {
  analyses: [],
  cases: [],
  runs: [],
  datasets: [],
  defects: [],
  documents: [],
  chats: [],
  jobs: [],
  documentation: [],
  scripts: [],
  rtm: [],
  audit: [],
  contracts: {},
};
const PAGES = [
  ["Overview", LayoutDashboard],
  ["Requirements", FileText],
  ["Test Cases", ClipboardCheck],
  ["Execution", Play],
  ["Document Chat", MessageSquare],
  ["Defects", Bug],
  ["Reports", Activity],
  ["Settings", Settings],
];
const FIELD_KEYS = [
  "owner",
  "environment",
  "build_version",
  "requirement_ids",
  "title",
  "module",
  "scenario",
  "category",
  "test_type",
  "priority",
  "severity",
  "preconditions",
  "steps",
  "test_data",
  "expected_result",
  "postconditions",
  "automation_key",
  "source_quote",
  "assumptions",
  "tags",
];
const DEFECT_KEYS = [
  "title",
  "description",
  "steps_to_reproduce",
  "expected_result",
  "actual_result",
  "severity",
  "priority",
  "classification",
  "possible_root_cause",
  "evidence_reasoning",
  "regression_scenarios",
  "uncertainties",
];
const pretty = (s) => String(s || "").replaceAll("_", " ");
const date = (s) => (s ? new Date(s).toLocaleString() : "—");
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
async function api(path, options = {}) {
  const r = await fetch("/api" + path, {
    ...options,
    headers:
      options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await r
    .json()
    .catch(() => ({ detail: "Unexpected server response" }));
  if (!r.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail),
    );
  return data;
}
const post = (path, body) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
function Badge({ children, tone }) {
  const v = String(children || "");
  return (
    <span
      className={
        "badge " +
        (tone ||
          (/passed|approved|ready|completed|Covered/.test(v)
            ? "green"
            : /failed|error|rejected/.test(v)
              ? "red"
              : /running|queued/.test(v)
                ? "blue"
                : /draft|not_run|No |High/.test(v)
                  ? "amber"
                  : "slate"))
      }
    >
      {pretty(v)}
    </span>
  );
}
function Button({
  children,
  icon: Icon,
  variant = "",
  className = "",
  ...props
}) {
  return (
    <button className={"btn " + variant + " " + className} {...props}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}
function Empty({ icon: Icon = FolderOpen, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={"panel " + className}>
      {title && (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
function Label({ title, children, hint }) {
  return (
    <label className="field">
      <span>{title}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function List({ items }) {
  return items?.length ? (
    <ul className="plain-list">
      {items.map((x, i) => (
        <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>
      ))}
    </ul>
  ) : (
    <p className="muted">None recorded.</p>
  );
}
function Provenance({ value, onInspect }) {
  return value ? (
    <div className="provenance">
      <Sparkles size={14} />
      {value.provider} / {value.model}
      <span>·</span>
      {(value.latency_ms / 1000).toFixed(1)}s{" "}
      <button onClick={() => onInspect(value.call_id)}>
        Inspect prompt & output <ArrowUpRight size={12} />
      </button>
    </div>
  ) : null;
}
function App() {
  const [page, setPage] = useState("Overview"),
    [state, setState] = useState(EMPTY),
    [settings, setSettings] = useState({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(false);
  const [config, setConfig] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("qa_config")) || {
          provider: "ollama",
          model: "qwen2.5:3b",
          temperature: 0,
          max_tokens: 3500,
        }
      );
    } catch {
      return {
        provider: "ollama",
        model: "qwen2.5:3b",
        temperature: 0,
        max_tokens: 3500,
      };
    }
  });
  const [models, setModels] = useState([]),
    [modal, setModal] = useState(null),
    [caseEdit, setCaseEdit] = useState(null),
    [defectEdit, setDefectEdit] = useState(null);
  const completed = useRef(new Set()),
    firstLoad = useRef(true);
  async function refresh() {
    try {
      let s = await api("/state");
      setState(s);
      setOnline(true);
      for (const j of s.jobs) {
        if (
          ["completed", "error", "interrupted"].includes(j.status) &&
          !completed.current.has(j.id)
        ) {
          completed.current.add(j.id);
          if (!firstLoad.current) {
            if (j.status === "completed") setNotice(j.kind + " complete.");
            else setError(j.kind + ": " + j.error);
          }
        }
      }
      firstLoad.current = false;
    } catch (e) {
      setOnline(false);
    }
  }
  useEffect(() => {
    refresh();
    api("/settings")
      .then(setSettings)
      .catch((e) => setError(e.message));
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    localStorage.setItem("qa_config", JSON.stringify(config));
  }, [config]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 8000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  async function act(fn, msg) {
    setError("");
    setBusy(true);
    try {
      let r = await fn();
      await refresh();
      if (msg) setNotice(msg);
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  const task = (path, body) =>
    act(
      () => post(path, body),
      "Task queued. Progress appears at the bottom of the page.",
    );
  const inspect = (id) =>
    act(async () => {
      setModal({
        title: "AI provenance · exact prompt and output",
        data: await api("/ai-calls/" + id),
      });
    });
  const activeJobs = state.jobs.filter((j) =>
    ["queued", "running"].includes(j.status),
  );
  const heading = {
    Overview: [
      "Your quality command center",
      "Turn requirements into reviewed tests and verifiable results.",
    ],
    Requirements: [
      "From requirements to test intent",
      "Analyze acceptance criteria, ambiguity, risks and test scenarios.",
    ],
    "Test Cases": [
      "Design with evidence. Review with confidence.",
      "Traceable test cases, explicit assumptions and human approval.",
    ],
    Execution: [
      "Run real tests. Keep the evidence.",
      "Execute Playwright against SauceDemo with isolated browser sessions.",
    ],
    "Document Chat": [
      "Ask your documents. Trace every answer.",
      "Upload a source, explore its requirements and build a QA report.",
    ],
    Defects: [
      "From failure to a useful defect",
      "Review the evidence, challenge the hypothesis and publish to Jira.",
    ],
    Reports: [
      "A complete picture of quality",
      "Keep design coverage separate from execution and passing results.",
    ],
    Settings: [
      "Connect your tools",
      "Configure local AI, cloud inference and your Jira project.",
    ],
  }[page];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Layers size={22} />
          </div>
          <div>
            QA Workbench<small>AI-ASSISTED ENGINEERING</small>
          </div>
        </div>
        <div className="workspace">
          <span className="workspace-icon">S</span>
          <div>
            SauceDemo<small>Individual assessment</small>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {PAGES.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Defects" && state.defects.length > 0 && (
                <b>{state.defects.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <ShieldCheck size={18} />
            <div>
              Human-reviewed AI<small>Evidence before confidence.</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">AM</div>
            <div>
              Abdul Majid<small>Quality engineer</small>
            </div>
            <span className={"dot " + (online ? "green" : "red")} />
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} /> <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <span className={"dot " + (online ? "green" : "red")} />
              {online ? "Backend connected" : "Backend unavailable"}
            </span>
            <a
              href="https://www.saucedemo.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open SauceDemo <ExternalLink size={14} />
            </a>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">AI-POWERED QA WORKBENCH</div>
              <h1>{heading[0]}</h1>
              <p>{heading[1]}</p>
            </div>
            <Button
              icon={RefreshCw}
              variant="ghost"
              onClick={refresh}
              aria-label="Refresh workspace"
            />
          </div>
          <div className="model-strip">
            <span className="ai-symbol">
              <Sparkles size={17} />
            </span>
            <strong>AI engine</strong>
            <select
              aria-label="AI provider"
              value={config.provider}
              onChange={(e) => {
                setModels([]);
                setConfig({
                  ...config,
                  provider: e.target.value,
                  model:
                    e.target.value === "groq"
                      ? settings.groq_model || "llama-3.3-70b-versatile"
                      : settings.ollama_model || "qwen2.5:3b",
                });
              }}
            >
              <option value="ollama">Ollama · local</option>
              <option value="groq">Groq · cloud</option>
            </select>
            <input
              aria-label="AI model name"
              list="models"
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
            />
            <datalist id="models">
              {models.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </datalist>
            <button
              className="link-button"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const r = await api("/models/" + config.provider);
                  setModels(r.models);
                  setNotice(
                    r.models.length +
                      " models discovered. Choose a chat model from the model field.",
                  );
                })
              }
            >
              Discover models <RefreshCw size={13} />
            </button>
            <span className="model-privacy">
              {config.provider === "ollama"
                ? "Source text stays on your local model"
                : "Source excerpts are sent to Groq"}
            </span>
          </div>
          {error && (
            <div role="alert" className="alert error">
              <TriangleAlert size={20} />
              <div>{error}</div>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="alert success">
              <CheckCircle2 size={18} />
              <div>{notice}</div>
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === "Overview" && (
            <Overview
              state={state}
              setPage={setPage}
              settings={settings}
              online={online}
            />
          )}
          {page === "Requirements" && (
            <Requirements
              state={state}
              config={config}
              task={task}
              busy={busy}
              inspect={inspect}
              setPage={setPage}
              act={act}
            />
          )}
          {page === "Test Cases" && (
            <Cases
              state={state}
              setCaseEdit={setCaseEdit}
              task={task}
              config={config}
              busy={busy}
              inspect={inspect}
              setPage={setPage}
              setModal={setModal}
            />
          )}
          {page === "Execution" && (
            <Execution
              state={state}
              act={act}
              task={task}
              config={config}
              busy={busy}
              setPage={setPage}
            />
          )}
          {page === "Document Chat" && (
            <Documents
              state={state}
              config={config}
              task={task}
              act={act}
              busy={busy}
              inspect={inspect}
              setPage={setPage}
            />
          )}
          {page === "Defects" && (
            <Defects
              state={state}
              act={act}
              busy={busy}
              setDefectEdit={setDefectEdit}
              setModal={setModal}
              inspect={inspect}
              setPage={setPage}
            />
          )}
          {page === "Reports" && (
            <Reports
              state={state}
              task={task}
              config={config}
              busy={busy}
              inspect={inspect}
            />
          )}
          {page === "Settings" && (
            <SettingsPage
              settings={settings}
              config={config}
              setConfig={setConfig}
              act={act}
              setModal={setModal}
              busy={busy}
            />
          )}
          {activeJobs.length > 0 && (
            <div className="job-dock">
              <LoaderCircle size={19} className="spin" />
              <div>
                <strong>{activeJobs[0].kind}</strong>
                <small>
                  {activeJobs.length} task{activeJobs.length > 1 ? "s" : ""}{" "}
                  pending · Local models may take several minutes. You can use
                  other pages.
                </small>
              </div>
              <Badge>{activeJobs[0].status}</Badge>
            </div>
          )}
          <footer>
            QA Workbench <span>·</span> SauceDemo assessment <span>·</span> AI
            assists. You decide.
          </footer>
        </div>
      </main>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{modal.title}</h2>
              <button aria-label="Close dialog" onClick={() => setModal(null)}>
                <X />
              </button>
            </div>
            <pre className="code-block">
              {typeof modal.data === "string"
                ? modal.data
                : JSON.stringify(modal.data, null, 2)}
            </pre>
          </section>
        </div>
      )}
      {caseEdit && (
        <CaseEditor
          record={caseEdit}
          state={state}
          onClose={() => setCaseEdit(null)}
          busy={busy}
          onSave={async (body) => {
            const r = await act(
              () =>
                api("/cases/" + caseEdit.id, {
                  method: "PUT",
                  body: JSON.stringify(body),
                }),
              "Test case saved.",
            );
            if (r) setCaseEdit(null);
          }}
        />
      )}
      {defectEdit && (
        <DefectEditor
          record={defectEdit}
          onClose={() => setDefectEdit(null)}
          busy={busy}
          onSave={async (body) => {
            const r = await act(
              () =>
                api("/defects/" + defectEdit.id, {
                  method: "PUT",
                  body: JSON.stringify(body),
                }),
              "Defect reviewed.",
            );
            if (r) setDefectEdit(null);
          }}
        />
      )}
    </div>
  );
}
function Overview({ state, setPage, settings, online }) {
  const results = state.runs.flatMap((r) => r.results),
    passed = results.filter((r) => r.status === "passed").length,
    failed = results.filter((r) => r.status === "failed").length,
    approved = state.cases.filter((c) => c.review_status === "approved").length;
  return (
    <>
      <div className="hero">
        <div>
          <div className="hero-kicker">
            <span className="dot green" /> YOUR END-TO-END QA WORKFLOW
          </div>
          <h2>
            Better questions.
            <br />
            Stronger tests. Clearer evidence.
          </h2>
          <p>
            Move from a requirement to a reviewable defect in one workspace.
            <br />
            Start with source evidence. Finish with results you can explain.
          </p>
          <Button icon={Plus} onClick={() => setPage("Requirements")}>
            Analyze requirements
          </Button>
          <Button
            variant="hero-secondary"
            icon={Play}
            onClick={() => setPage("Execution")}
          >
            Run a baseline
          </Button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-card art-back">
            <Code2 size={22} />
            <span>REAL AUTOMATION</span>
            <div className="fake-line" />
            <div className="fake-line short" />
          </div>
          <div className="art-card art-front">
            <div className="art-check">
              <Check size={28} />
            </div>
            <strong>Evidence, connected.</strong>
            <span>Requirements → Tests → Results</span>
            <div className="mini-chips">
              <span>AI-assisted</span>
              <span>Human-reviewed</span>
            </div>
          </div>
        </div>
      </div>
      <div className="metrics">
        {[
          [
            FileText,
            "Requirements",
            state.rtm.length,
            "From your analyzed sources",
            "blue",
          ],
          [
            ClipboardCheck,
            "Test cases",
            state.cases.length,
            approved + " reviewed & approved",
            "purple",
          ],
          [
            CheckCircle2,
            "Tests passed",
            passed,
            results.length + " individual results recorded",
            "green",
          ],
          [
            Bug,
            "Tests failed",
            failed,
            "Includes labeled demo failures",
            "orange",
          ],
        ].map(([Icon, label, value, sub, color]) => (
          <div className="metric" key={label}>
            <div className={"metric-icon " + color}>
              <Icon size={20} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      <Panel
        title="Your path from intent to evidence"
        subtitle="Six connected steps. Each produces something you can review."
      >
        <div className="workflow">
          {[
            ["01", "Analyze", "Clarify requirements", "Requirements", FileText],
            ["02", "Design", "Generate test cases", "Test Cases", Sparkles],
            ["03", "Review", "Approve & map tests", "Test Cases", ShieldCheck],
            ["04", "Execute", "Run in a real browser", "Execution", Play],
            ["05", "Investigate", "Explain failed results", "Defects", Bug],
            ["06", "Report", "Share the evidence", "Reports", Activity],
          ].map(([n, title, sub, to, Icon]) => (
            <button key={n} onClick={() => setPage(to)}>
              <div>
                <span>{n}</span>
                <Icon size={20} />
              </div>
              <strong>{title}</strong>
              <small>{sub}</small>
            </button>
          ))}
        </div>
      </Panel>
      <div className="grid two">
        <Panel
          title="Recent executions"
          action={
            <button
              className="link-button"
              onClick={() => setPage("Execution")}
            >
              View all <ArrowRight size={14} />
            </button>
          }
        >
          {state.runs.length ? (
            <div className="record-list">
              {state.runs.slice(0, 4).map((r) => (
                <button
                  className="record-row"
                  key={r.id}
                  onClick={() => setPage("Execution")}
                >
                  <span className="row-icon">
                    <Play size={17} />
                  </span>
                  <div>
                    <strong>{pretty(r.suite)}</strong>
                    <small>{date(r.created_at)}</small>
                  </div>
                  <Badge>{r.status}</Badge>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          ) : (
            <Empty icon={Play} title="Your first run starts here">
              Run the curated smoke suite to verify login, cart, checkout and
              logout.
            </Empty>
          )}
        </Panel>
        <Panel
          title="Demo readiness"
          subtitle="Check these before your 30-minute presentation"
        >
          <div className="readiness">
            {[
              ["Backend & workspace", online],
              ["AI provider configured", settings.groq_configured || false],
              ["Reviewed test cases", approved > 0],
              [
                "Completed browser execution",
                state.runs.some((r) => r.status === "completed"),
              ],
              ["Jira credentials configured", settings.jira_configured],
            ].map(([s, ok]) => (
              <div key={s}>
                {ok ? (
                  <CheckCircle2 size={18} className="green-text" />
                ) : (
                  <span className="hollow-dot" />
                )}
                <span>{s}</span>
                <small>
                  {s === "AI provider configured" && !ok
                    ? "Verify Ollama in Settings"
                    : ok
                      ? "Ready"
                      : "To do"}
                </small>
              </div>
            ))}
          </div>
          <div className="panel-note">
            Configuration is not a successful connection check. Verify the AI
            model and Jira in Settings.
          </div>
        </Panel>
      </div>
    </>
  );
}
function Requirements({ state, config, task, busy, inspect, setPage, act }) {
  const [text, setText] = useState(""),
    [title, setTitle] = useState("SauceDemo core workflows"),
    [selected, setSelected] = useState(""),
    [count, setCount] = useState(4);
  const a = state.analyses.find((x) => x.id === selected) || state.analyses[0];
  return (
    <div className="grid requirement-grid">
      <Panel
        title="Requirement input"
        subtitle="A user story, acceptance criteria or a product brief."
      >
        <div className="panel-body">
          <Label title="Requirement set name">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Label>
          <Label title="Source requirements">
            <textarea
              className="requirements-text"
              placeholder="As a shopper, I can sign in with valid credentials…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </Label>
          <div className="between">
            <button
              className="link-button"
              onClick={() =>
                act(async () => {
                  const s = await api("/sample-requirements");
                  setText(s.text);
                })
              }
            >
              <FileText size={14} />
              Load SauceDemo sample
            </button>
            <small>{text.length.toLocaleString()} / 24,000 characters</small>
          </div>
          <Button
            className="full"
            icon={Sparkles}
            disabled={busy || text.length < 20 || text.length > 24000}
            onClick={() => task("/analyses", { text, title, config })}
          >
            Analyze with AI
          </Button>
          <div className="callout">
            <ShieldCheck size={18} />
            <p>
              AI extracts requirements and proposes scenarios. Source quotes are
              checked, but you still review the meaning and assumptions.
            </p>
          </div>
        </div>
      </Panel>
      <Panel
        title="Analysis workspace"
        action={
          state.analyses.length > 0 && (
            <select
              aria-label="Analysis history"
              value={a?.id || ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {state.analyses.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          )
        }
      >
        {!a ? (
          <Empty icon={Sparkles} title="Bring your requirements into focus">
            Add your requirements or load the sample. AI will extract acceptance
            criteria, gaps and scenarios.
          </Empty>
        ) : (
          <div className="panel-body">
            <div className="analysis-summary">
              <span className="eyebrow">SUMMARY</span>
              <p>{a.summary}</p>
            </div>
            <Provenance value={a.provenance} onInspect={inspect} />
            <div className="section-label">
              REQUIREMENTS & ACCEPTANCE CRITERIA{" "}
              <span>{a.requirements.length}</span>
            </div>
            {a.requirements.map((r) => (
              <details className="requirement-card" key={r.id} open>
                <summary>
                  <strong>{r.title}</strong>
                  <Badge tone={r.grounded ? "green" : "red"}>
                    {r.grounded ? "Quote matched" : "Quote needs review"}
                  </Badge>
                </summary>
                <small className="mono">{r.id}</small>
                <p>{r.statement}</p>
                <List items={r.acceptance_criteria} />
                <blockquote>{r.source_quote}</blockquote>
                {r.risks.length > 0 && <List items={r.risks} />}
              </details>
            ))}
            <div className="grid two compact">
              <div className="tinted amber">
                <h3>Ambiguities & missing details</h3>
                <List items={[...a.ambiguities, ...a.missing_information]} />
              </div>
              <div className="tinted blue">
                <h3>Suggested additions</h3>
                <List items={a.suggested_additions} />
              </div>
            </div>
            <h3>Suggested scenarios</h3>
            {a.scenarios.map((s, i) => (
              <div className="scenario" key={i}>
                <Badge>{s.category}</Badge>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.rationale}</p>
                </div>
              </div>
            ))}
            <div className="action-bar">
              <Label title="Cases per request">
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 6, 8].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Label>
              <Button
                icon={Sparkles}
                disabled={busy}
                onClick={() =>
                  task("/cases/generate", { analysis_id: a.id, count, config })
                }
              >
                Generate test cases
              </Button>
              <Button variant="secondary" onClick={() => setPage("Test Cases")}>
                Open test cases <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
function Cases({
  state,
  setCaseEdit,
  task,
  config,
  busy,
  inspect,
  setPage,
  setModal,
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [expanded, setExpanded] = useState(null),
    [allColumns, setAllColumns] = useState(false);
  const cases = state.cases.filter(
    (c) =>
      (c.title + " " + c.id + " " + c.module)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" || c.review_status === filter),
  );
  return (
    <>
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="Search test cases"
            placeholder="Search title, test ID or module…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Review status filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All review states</option>
          <option value="draft">Drafts</option>
          <option value="approved">Approved</option>
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={allColumns}
            onChange={(e) => setAllColumns(e.target.checked)}
          />
          All QA columns
        </label>
        <a className="btn secondary" href="/api/export/cases.csv">
          <Download size={15} />
          CSV
        </a>
        <a className="btn secondary" href="/api/export/cases.json">
          JSON
        </a>
      </div>
      <Panel
        title="Test case repository"
        subtitle={`${state.cases.length} designed · ${state.cases.filter((c) => c.review_status === "approved").length} approved · Human review required`}
      >
        {!state.cases.length ? (
          <Empty
            icon={ClipboardCheck}
            title="Your test design starts with a requirement"
            action={
              <Button onClick={() => setPage("Requirements")}>
                Go to Requirements <ArrowRight size={15} />
              </Button>
            }
          >
            Generate structured cases, then inspect their source, steps, data
            and expected outcomes.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Test ID / scenario</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Review</th>
                  <th>Execution</th>
                  <th>Automation</th>
                  {allColumns &&
                    [
                      "Requirement IDs",
                      "Module",
                      "Type",
                      "Severity",
                      "Preconditions",
                      "Steps & expected results",
                      "Test data",
                      "Expected result",
                      "Postconditions",
                      "Source quote",
                      "Owner",
                      "Environment",
                      "Build version",
                      "Assumptions",
                      "Tags",
                      "Actual result",
                      "Reviewer",
                      "Review note",
                      "Evidence",
                      "Defects",
                    ].map((s) => <th key={s}>{s}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr>
                      <td className="title-cell">
                        <button
                          className="table-title"
                          onClick={() =>
                            setExpanded(expanded === c.id ? null : c.id)
                          }
                        >
                          <strong>{c.title}</strong>
                          <small>{c.id}</small>
                        </button>
                      </td>
                      <td>
                        <Badge>{c.category}</Badge>
                      </td>
                      <td>
                        <Badge>{c.priority}</Badge>
                      </td>
                      <td>
                        <Badge>{c.review_status}</Badge>
                        {c.validation_issues.length > 0 && (
                          <small className="red-text">
                            {c.validation_issues.length} validation issues
                          </small>
                        )}
                      </td>
                      <td>
                        <Badge>{c.execution_status}</Badge>
                      </td>
                      <td>
                        <span className="mono">{c.automation_key}</span>
                      </td>
                      {allColumns &&
                        [
                          c.requirement_ids,
                          c.module,
                          c.test_type,
                          c.severity,
                          c.preconditions,
                          c.steps,
                          c.test_data,
                          c.expected_result,
                          c.postconditions,
                          c.source_quote,
                          c.owner,
                          c.environment,
                          c.build_version,
                          c.assumptions,
                          c.tags,
                          c.actual_result,
                          c.reviewer,
                          c.review_note,
                          c.evidence || {},
                          c.defect_ids,
                        ].map((x, i) => (
                          <td className="wide-cell" key={i}>
                            {typeof x === "object"
                              ? JSON.stringify(x)
                              : x || "—"}
                          </td>
                        ))}
                      <td>
                        <Button
                          variant="secondary small"
                          onClick={() => setCaseEdit(c)}
                        >
                          Review / edit
                        </Button>
                      </td>
                    </tr>
                    {expanded === c.id && (
                      <tr>
                        <td colSpan={allColumns ? 27 : 7}>
                          <div className="case-detail">
                            <div className="grid two">
                              <div>
                                <h3>Scenario</h3>
                                <p>{c.scenario}</p>
                                <h3>Preconditions</h3>
                                <List items={c.preconditions} />
                                <h3>Steps & expected outcomes</h3>
                                <ol className="step-list">
                                  {c.steps.map((s, i) => (
                                    <li key={i}>
                                      {s.action}
                                      <small>Expect: {s.expected}</small>
                                    </li>
                                  ))}
                                </ol>
                                <h3>Expected result</h3>
                                <p>{c.expected_result}</p>
                              </div>
                              <div>
                                <h3>Test data</h3>
                                <pre className="code-block">
                                  {JSON.stringify(c.test_data, null, 2)}
                                </pre>
                                <h3>Source evidence</h3>
                                <blockquote>{c.source_quote}</blockquote>
                                <h3>Assumptions</h3>
                                <List items={c.assumptions} />
                                <h3>Automation contract</h3>
                                <p>{state.contracts[c.automation_key]}</p>
                                {c.validation_issues.length > 0 && (
                                  <div className="tinted red">
                                    <List items={c.validation_issues} />
                                  </div>
                                )}
                              </div>
                            </div>
                            <Provenance
                              value={c.provenance}
                              onInspect={inspect}
                            />
                            <Button
                              variant="secondary"
                              icon={Code2}
                              disabled={busy}
                              onClick={() =>
                                task("/cases/" + c.id + "/script", config)
                              }
                            >
                              Generate AI script draft
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {!cases.length && (
              <p className="panel-body muted">No cases match these filters.</p>
            )}
          </div>
        )}
      </Panel>
      {state.scripts.length > 0 && (
        <Panel
          title="AI-generated automation drafts"
          subtitle="Review these scripts before running them. The app executes its controlled page objects."
        >
          <div className="record-list">
            {state.scripts.map((s) => (
              <div className="record-row" key={s.id}>
                <Code2 size={20} />
                <div>
                  <strong>{s.case_id}</strong>
                  <small>{s.explanation}</small>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setModal({ title: "AI automation draft", data: s })
                  }
                >
                  Inspect
                </Button>
                <a
                  className="btn secondary"
                  href={"/api/scripts/" + s.id + "/download"}
                >
                  <Download size={15} />
                  Python
                </a>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
function CaseEditor({ record, state, onClose, onSave, busy }) {
  const [c, setC] = useState(pick(record, FIELD_KEYS)),
    [reviewer, setReviewer] = useState(record.reviewer || "Abdul"),
    [note, setNote] = useState(record.review_note || ""),
    [data, setData] = useState(JSON.stringify(record.test_data, null, 2)),
    [localError, setLocalError] = useState("");
  const update = (k, v) => setC({ ...c, [k]: v });
  function submit(approve) {
    try {
      const parsed = JSON.parse(data);
      if (
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        parsed === null
      )
        throw Error("Test data must be a JSON object");
      onSave({
        case: { ...c, test_data: parsed },
        approve,
        reviewer,
        review_note: note,
      });
    } catch (e) {
      setLocalError(e.message);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal large"
        role="dialog"
        aria-modal="true"
        aria-label="Review test case"
      >
        <div className="modal-head">
          <div>
            <small>{record.id}</small>
            <h2>Review the case, evidence and execution contract</h2>
          </div>
          <button aria-label="Close case editor" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-content">
          {localError && <div className="alert error">{localError}</div>}
          <div className="grid two compact">
            {[
              "title",
              "module",
              "scenario",
              "expected_result",
              "source_quote",
              "owner",
              "environment",
              "build_version",
            ].map((k) => (
              <Label key={k} title={pretty(k)}>
                <textarea
                  rows={k === "source_quote" ? 3 : 2}
                  value={c[k]}
                  onChange={(e) => update(k, e.target.value)}
                />
              </Label>
            ))}
            {[
              ["category", ["Positive", "Negative", "Boundary", "Edge"]],
              [
                "test_type",
                ["Functional", "Regression", "Smoke", "Security", "Usability"],
              ],
              ["priority", ["High", "Medium", "Low"]],
              ["severity", ["Critical", "Major", "Minor", "Trivial"]],
              ["automation_key", Object.keys(state.contracts)],
            ].map(([k, values]) => (
              <Label key={k} title={pretty(k)}>
                <select
                  value={c[k]}
                  onChange={(e) => update(k, e.target.value)}
                >
                  {values.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Label>
            ))}
          </div>
          <div className="callout">
            <ShieldCheck size={20} />
            <p>
              <strong>Executable contract: </strong>
              {state.contracts[c.automation_key]} Approve only if the steps and
              expected result match this contract. Other scenarios must remain
              manual.
            </p>
          </div>
          <div className="grid two compact">
            {[
              "requirement_ids",
              "preconditions",
              "postconditions",
              "assumptions",
              "tags",
            ].map((k) => (
              <Label key={k} title={pretty(k) + " · one per line"}>
                <textarea
                  value={c[k].join("\n")}
                  onChange={(e) => update(k, e.target.value.split("\n"))}
                  onBlur={() =>
                    update(
                      k,
                      c[k].filter((v) => v.trim()),
                    )
                  }
                />
              </Label>
            ))}
            <Label title="Test data · JSON object with string values">
              <textarea
                className="mono"
                rows={6}
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </Label>
          </div>
          <h3>Test steps</h3>
          {c.steps.map((s, i) => (
            <div className="step-editor" key={i}>
              <span>{i + 1}</span>
              <input
                aria-label={"Step " + (i + 1) + " action"}
                value={s.action}
                onChange={(e) =>
                  update(
                    "steps",
                    c.steps.map((v, j) =>
                      j === i ? { ...v, action: e.target.value } : v,
                    ),
                  )
                }
              />
              <input
                aria-label={"Step " + (i + 1) + " expected result"}
                value={s.expected}
                onChange={(e) =>
                  update(
                    "steps",
                    c.steps.map((v, j) =>
                      j === i ? { ...v, expected: e.target.value } : v,
                    ),
                  )
                }
              />
              <button
                aria-label={"Remove step " + (i + 1)}
                onClick={() =>
                  update(
                    "steps",
                    c.steps.filter((_, j) => j !== i),
                  )
                }
              >
                <X size={15} />
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() =>
              update("steps", [...c.steps, { action: "", expected: "" }])
            }
          >
            Add step
          </Button>
          <div className="grid two compact review-fields">
            <Label title="Reviewer">
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              />
            </Label>
            <Label title="Review note · required for approval">
              <textarea
                placeholder="Confirmed source, assumptions, data and adapter contract…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Label>
          </div>
          <p className="muted">
            Saving a changed case resets its latest execution state. Earlier
            runs retain the approved snapshot.
          </p>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => submit(false)}
          >
            Save as draft
          </Button>
          <Button
            icon={ShieldCheck}
            disabled={busy || !note.trim()}
            onClick={() => submit(true)}
          >
            Save & approve
          </Button>
        </div>
      </section>
    </div>
  );
}
function Execution({ state, act, task, config, busy, setPage }) {
  const [suite, setSuite] = useState("smoke"),
    [datasetId, setDatasetId] = useState(""),
    [selected, setSelected] = useState([]),
    [headless, setHeadless] = useState(true),
    [runId, setRunId] = useState(""),
    [detail, setDetail] = useState(null);
  const approved = state.cases.filter(
    (c) => c.review_status === "approved" && c.automation_key !== "manual",
  );
  const run = state.runs.find((r) => r.id === runId) || state.runs[0];
  const running = state.runs.some((r) =>
    ["queued", "running"].includes(r.status),
  );
  const options = [
    [
      "smoke",
      "Core smoke suite",
      "Login, add to cart, checkout and logout. Curated framework baseline.",
    ],
    [
      "data_driven",
      "Data-driven login",
      "Run one test per CSV / JSON row, with independent assertions.",
    ],
    [
      "approved",
      "Reviewed AI test cases",
      "Execute selected approved cases through their mapped workflows.",
    ],
    [
      "failure_demo",
      "Controlled failure demo",
      "A deliberately wrong checkout assertion; clearly marked as injected.",
    ],
  ];
  async function upload(e) {
    const f = e.target.files[0];
    if (!f) return;
    let form = new FormData();
    form.append("file", f);
    const r = await act(
      () => api("/datasets", { method: "POST", body: form }),
      "Dataset validated and imported.",
    );
    if (r) setDatasetId(r.id);
    e.target.value = "";
  }
  return (
    <>
      <div className="grid execution-grid">
        <Panel
          title="Configure a run"
          subtitle="Target: https://www.saucedemo.com"
        >
          <div className="panel-body">
            <div className="suite-list">
              {options.map(([id, name, desc]) => (
                <label
                  className={"suite " + (suite === id ? "selected" : "")}
                  key={id}
                >
                  <input
                    type="radio"
                    name="suite"
                    checked={suite === id}
                    onChange={() => setSuite(id)}
                  />
                  <div>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                  </div>
                </label>
              ))}
            </div>
            {suite === "data_driven" && (
              <div className="dataset-box">
                <Label title="Dataset">
                  <select
                    value={datasetId}
                    onChange={(e) => setDatasetId(e.target.value)}
                  >
                    <option value="">Built-in sample · 5 rows</option>
                    {state.datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.rows.length} rows
                      </option>
                    ))}
                  </select>
                </Label>
                <label className="btn secondary">
                  <Upload size={15} />
                  Import CSV / JSON
                  <input
                    type="file"
                    hidden
                    accept=".csv,.json"
                    onChange={upload}
                  />
                </label>
                <div className="links">
                  <a href="/api/datasets/sample/csv">Sample CSV</a>
                  <a href="/api/datasets/sample/json">Sample JSON</a>
                </div>
                <p className="muted">
                  Required: case_id, username, password, expected. Optional:
                  expected_error. Only synthetic/public demo credentials.
                </p>
                {datasetId && (
                  <details>
                    <summary>Preview dataset</summary>
                    <pre className="code-block">
                      {JSON.stringify(
                        state.datasets.find((d) => d.id === datasetId)?.rows,
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                )}
              </div>
            )}
            {suite === "approved" && (
              <div className="selection-list">
                {approved.length ? (
                  approved.map((c) => (
                    <label className="checkbox" key={c.id}>
                      <input
                        type="checkbox"
                        checked={selected.includes(c.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, c.id]
                              : selected.filter((id) => id !== c.id),
                          )
                        }
                      />
                      <span>
                        {c.title}
                        <small>{c.automation_key}</small>
                      </span>
                    </label>
                  ))
                ) : (
                  <p>
                    No approved automatable cases. Review a case in Test Cases
                    first.
                  </p>
                )}
              </div>
            )}
            {suite === "failure_demo" && (
              <div className="callout amber">
                <TriangleAlert size={20} />
                <p>
                  This performs a real checkout, then deliberately expects
                  incorrect confirmation text. Its failure is a demonstration,
                  not a discovered SauceDemo defect.
                </p>
              </div>
            )}
            <label className="checkbox spacing">
              <input
                type="checkbox"
                checked={!headless}
                onChange={(e) => setHeadless(!e.target.checked)}
              />
              Show browser window on this computer
            </label>
            <Button
              className="full"
              icon={running ? LoaderCircle : Play}
              disabled={
                busy || running || (suite === "approved" && !selected.length)
              }
              onClick={() =>
                act(async () => {
                  let r = await post("/runs", {
                    suite,
                    dataset_id: datasetId || null,
                    case_ids: selected,
                    headless,
                  });
                  setRunId(r.id);
                }, "Execution started. Results update as each test completes.")
              }
            >
              {running ? "Execution in progress" : "Start execution"}
            </Button>
            <small className="muted block">
              Chromium · isolated context per test · auto-waiting assertions
            </small>
          </div>
        </Panel>
        <Panel
          title="Execution results"
          action={
            state.runs.length > 0 && (
              <select
                aria-label="Execution history"
                value={run?.id || ""}
                onChange={(e) => setRunId(e.target.value)}
              >
                {state.runs.map((r) => (
                  <option value={r.id} key={r.id}>
                    {pretty(r.suite)} · {date(r.created_at)}
                  </option>
                ))}
              </select>
            )
          }
        >
          {!run ? (
            <Empty icon={Play} title="Ready for your first browser run">
              Choose a suite and start execution. Actual results, screenshots
              and traces will appear here.
            </Empty>
          ) : (
            <div className="panel-body">
              <div className="between">
                <div>
                  <h3>{pretty(run.suite)}</h3>
                  <small className="mono">{run.id}</small>
                </div>
                <Badge>{run.status}</Badge>
              </div>
              <div className="run-counts">
                {["passed", "failed", "skipped", "not_run"].map((s) => (
                  <div key={s}>
                    <strong>
                      {run.status === "running" && s !== "not_run"
                        ? run.results.filter((r) => r.status === s).length
                        : run.counts?.[s] || 0}
                    </strong>
                    <span>{pretty(s)}</span>
                  </div>
                ))}
              </div>
              {run.error && <div className="alert error">{run.error}</div>}
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Test / dataset</th>
                      <th>Result</th>
                      <th>Duration</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.results.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button
                            className="table-title"
                            onClick={() =>
                              setDetail(detail === r.id ? null : r.id)
                            }
                          >
                            <strong>{r.title}</strong>
                            <small>
                              {r.id}
                              {r.injected ? " · INJECTED DEMO" : ""}
                            </small>
                          </button>
                        </td>
                        <td>
                          <Badge>{r.status}</Badge>
                        </td>
                        <td>{(r.duration_ms / 1000).toFixed(1)}s</td>
                        <td>
                          <div className="inline-actions">
                            {r.evidence.screenshot && (
                              <a
                                href={r.evidence.screenshot}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Screenshot
                              </a>
                            )}
                            {r.evidence.trace && (
                              <a href={r.evidence.trace}>Trace</a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!run.results.length && (
                <div className="waiting">
                  {["queued", "running"].includes(run.status) && (
                    <LoaderCircle className="spin" size={24} />
                  )}
                  <p>
                    {["queued", "running"].includes(run.status)
                      ? "Launching browser and running the first test…"
                      : "No tests completed. See the run error above."}
                  </p>
                </div>
              )}
              {run.results
                .filter((r) => r.id === detail)
                .map((r) => (
                  <div className="result-detail" key={r.id}>
                    <h3>{r.title}</h3>
                    <div className="grid two compact">
                      <div>
                        <strong>Steps performed</strong>
                        <List items={r.steps} />
                        <strong>Expected</strong>
                        <p>{r.expected}</p>
                      </div>
                      <div>
                        <strong>Actual / assertion evidence</strong>
                        <pre className="code-block">{r.actual}</pre>
                      </div>
                    </div>
                    {r.evidence.screenshot && (
                      <img
                        className="evidence-image"
                        src={r.evidence.screenshot}
                        alt={"Browser screenshot for " + r.title}
                      />
                    )}
                    <details>
                      <summary>Dataset & browser logs</summary>
                      <pre className="code-block">
                        {JSON.stringify(
                          { data: r.data, url: r.url, console: r.console },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                    {r.status === "failed" && (
                      <Button
                        icon={Sparkles}
                        disabled={busy}
                        onClick={() =>
                          task("/failures/analyze", {
                            run_id: run.id,
                            result_id: r.id,
                            config,
                          })
                        }
                      >
                        Analyze failure with AI
                      </Button>
                    )}
                  </div>
                ))}
              <div className="action-bar">
                <a
                  className="btn secondary"
                  href={"/api/runs/" + run.id + "/report"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} />
                  Open HTML report
                </a>
                <Button variant="ghost" onClick={() => setPage("Defects")}>
                  Open defects <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <div className="callout">
        <BookOpen size={19} />
        <p>
          Click a test title to see its full result and analyze failures.
          Download traces and open them locally with{" "}
          <code>python -m playwright show-trace path-to-trace.zip</code>.
          Screenshots are for human review; the AI receives text logs and
          assertions.
        </p>
      </div>
    </>
  );
}
function Documents({ state, config, task, act, busy, inspect, setPage }) {
  const [docId, setDocId] = useState(""),
    [question, setQuestion] = useState(""),
    [focus, setFocus] = useState(""),
    [topK, setTopK] = useState(4),
    [count, setCount] = useState(4);
  const doc = state.documents.find((d) => d.id === docId) || state.documents[0];
  const chats = state.chats
    .filter((c) => c.document_id === doc?.id)
    .slice()
    .reverse();
  async function upload(e) {
    const f = e.target.files[0];
    if (!f) return;
    const form = new FormData();
    form.append("file", f);
    const r = await act(
      () => api("/documents", { method: "POST", body: form }),
      "Document indexed and ready.",
    );
    if (r) setDocId(r.id);
    e.target.value = "";
  }
  return (
    <div className="grid document-grid">
      <div>
        <Panel title="Source documents" subtitle="PDF, DOCX, TXT or Markdown">
          <div className="panel-body">
            <label className="upload-zone">
              <Upload size={25} />
              <strong>Add a document</strong>
              <small>Up to 10 MB · text-based files</small>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                hidden
                onChange={upload}
                disabled={busy}
              />
            </label>
            <div className="document-list">
              {state.documents.map((d) => (
                <button
                  className={doc?.id === d.id ? "selected" : ""}
                  key={d.id}
                  onClick={() => setDocId(d.id)}
                >
                  <FileText size={20} />
                  <div>
                    <strong>{d.name}</strong>
                    <small>{d.chunk_count} excerpts · ready</small>
                  </div>
                </button>
              ))}
            </div>
            <p className="muted">
              Sources are isolated by document. Retrieval uses BM25 lexical
              search; wording matters.
            </p>
          </div>
        </Panel>
        {doc && (
          <Panel title="Turn this source into tests">
            <div className="panel-body">
              <Label title="Requirement or topic to test">
                <textarea
                  rows={3}
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="For example: visiting hours and visitor limits"
                />
              </Label>
              <Label title="Number of cases">
                <select
                  value={count}
                  onChange={(e) => setCount(+e.target.value)}
                >
                  {[2, 3, 4, 6, 8].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Label>
              <Button
                icon={Sparkles}
                className="full"
                disabled={busy || focus.length < 5}
                onClick={() =>
                  task("/documents/testcases", {
                    document_id: doc.id,
                    focus,
                    count,
                    config,
                  })
                }
              >
                Analyze & generate cases
              </Button>
              <small className="block muted">
                Document-derived cases are manual. Only reviewed SauceDemo cases
                use browser adapters.
              </small>
              <Button variant="ghost" onClick={() => setPage("Test Cases")}>
                Open generated cases <ArrowRight size={14} />
              </Button>
              <a
                className="btn secondary full"
                href={"/api/documents/" + doc.id + "/report"}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={15} />
                Complete document report
              </a>
            </div>
          </Panel>
        )}
      </div>
      <Panel
        title={doc ? doc.name : "Document conversation"}
        subtitle="Evidence-grounded Q&A with a persistent question history"
        className="chat-panel"
      >
        {!doc ? (
          <Empty icon={MessageSquare} title="Your source is the starting point">
            Upload a document to ask questions, inspect evidence and generate
            source-linked test cases.
          </Empty>
        ) : (
          <>
            <div className="chat-messages">
              {!chats.length && (
                <Empty
                  icon={Sparkles}
                  title="What would you like to understand?"
                >
                  Ask a specific question using terms from the source. Answers
                  include cited excerpts so you can check them.
                </Empty>
              )}
              {chats.map((c) => (
                <div className="chat-turn" key={c.id}>
                  <div className="chat-question">
                    <span className="avatar small">AM</span>
                    <p>{c.question}</p>
                  </div>
                  <div className="chat-answer">
                    <div className="answer-head">
                      <span className="ai-symbol">
                        <Sparkles size={17} />
                      </span>
                      <strong>Workbench AI</strong>
                      <Badge tone={c.insufficient_evidence ? "amber" : "blue"}>
                        {c.insufficient_evidence
                          ? "Insufficient evidence"
                          : "Citations available"}
                      </Badge>
                    </div>
                    <p className="answer-text">{c.answer}</p>
                    {c.caveats.length > 0 && (
                      <div className="tinted amber">
                        <List items={c.caveats} />
                      </div>
                    )}
                    <details className="sources">
                      <summary>
                        <BookOpen size={14} />
                        Retrieved source excerpts · {c.excerpts.length}
                      </summary>
                      {c.excerpts.map((x) => (
                        <div className="source" key={x.id}>
                          <strong>
                            {x.id} · page/section {x.page} · score {x.score}
                          </strong>
                          <p>{x.text}</p>
                        </div>
                      ))}
                    </details>
                    <small className="muted">{c.validation}</small>
                    <Provenance value={c.provenance} onInspect={inspect} />
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-compose">
              <textarea
                aria-label="Document question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this document…"
                rows={3}
              />
              <div className="between">
                <label className="inline-field">
                  Source excerpts{" "}
                  <select
                    value={topK}
                    onChange={(e) => setTopK(+e.target.value)}
                  >
                    {[2, 3, 4, 6, 8].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <Button
                  icon={Send}
                  disabled={busy || question.length < 5}
                  onClick={async () => {
                    const r = await task("/chat", {
                      document_id: doc.id,
                      question,
                      top_k: topK,
                      config,
                    });
                    if (r) setQuestion("");
                  }}
                >
                  Ask document
                </Button>
              </div>
              <small>
                Each question retrieves from the selected document. Follow-ups
                must restate relevant details.
              </small>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
function Defects({
  state,
  act,
  busy,
  setDefectEdit,
  setModal,
  inspect,
  setPage,
}) {
  const [confirmId, setConfirmId] = useState(null);
  return !state.defects.length ? (
    <Panel>
      <Empty
        icon={Bug}
        title="Every useful defect starts with evidence"
        action={
          <Button onClick={() => setPage("Execution")}>
            Open Execution <ArrowRight size={15} />
          </Button>
        }
      >
        Expand a failed result and select “Analyze failure with AI.” You can use
        the controlled failure demo to practice the full workflow.
      </Empty>
    </Panel>
  ) : (
    <div className="defect-grid">
      {state.defects.map((d) => (
        <Panel
          key={d.id}
          title={d.title}
          action={<Badge>{d.review_status}</Badge>}
        >
          <div className="panel-body">
            <div className="inline-actions">
              <Badge tone={d.injected ? "amber" : "slate"}>
                {d.classification}
              </Badge>
              <Badge>{d.severity}</Badge>
              <Badge>{d.priority}</Badge>
            </div>
            <p>{d.description}</p>
            <div className="grid two compact">
              <div>
                <h3>Steps to reproduce</h3>
                <List items={d.steps_to_reproduce} />
                <h3>Expected</h3>
                <p>{d.expected_result}</p>
              </div>
              <div>
                <h3>Actual</h3>
                <pre className="code-block">{d.actual_result}</pre>
              </div>
            </div>
            <div className="tinted amber">
              <h3>Possible root cause · hypothesis</h3>
              <p>{d.possible_root_cause}</p>
              <small>{d.evidence_reasoning}</small>
            </div>
            <div className="grid two compact">
              <div>
                <h3>Additional regression scenarios</h3>
                <List items={d.regression_scenarios} />
              </div>
              <div>
                <h3>Uncertainties</h3>
                <List items={d.uncertainties} />
              </div>
            </div>
            <Provenance value={d.provenance} onInspect={inspect} />
            <div className="inline-actions">
              {d.evidence.screenshot && (
                <a
                  href={d.evidence.screenshot}
                  target="_blank"
                  rel="noreferrer"
                >
                  View failure screenshot <ExternalLink size={13} />
                </a>
              )}
              <small>
                {d.run_id} / {d.result_id}
              </small>
            </div>
            <div className="action-bar">
              <Button
                variant="secondary"
                onClick={() => setDefectEdit(d)}
                disabled={["published", "publishing", "unknown"].includes(
                  d.jira_status,
                )}
              >
                Review / edit
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  act(async () =>
                    setModal({
                      title: "Jira issue payload preview",
                      data: await api("/defects/" + d.id + "/jira-preview"),
                    }),
                  )
                }
              >
                Preview Jira payload
              </Button>
              {d.jira ? (
                <a
                  className="btn"
                  href={d.jira.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {d.jira.key}
                  <ExternalLink size={15} />
                </a>
              ) : (
                <Button
                  icon={Send}
                  disabled={
                    busy ||
                    d.review_status !== "approved" ||
                    ["unknown", "publishing"].includes(d.jira_status)
                  }
                  onClick={() => setConfirmId(confirmId === d.id ? null : d.id)}
                >
                  Publish to Jira
                </Button>
              )}
            </div>
            {confirmId === d.id && (
              <div className="publish-confirm">
                <strong>
                  Create this reviewed issue in your configured Jira project?
                </strong>
                <p>
                  This sends the defect title, description, reproduction steps
                  and evidence summary. Binary screenshots and traces remain
                  local.
                </p>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    const r = await act(
                      () =>
                        post("/defects/" + d.id + "/publish", {
                          confirm: true,
                        }),
                      "Jira issue created.",
                    );
                    if (r) setConfirmId(null);
                  }}
                >
                  Confirm create issue
                </Button>
                <Button variant="ghost" onClick={() => setConfirmId(null)}>
                  Cancel
                </Button>
              </div>
            )}
            {d.jira_error && <div className="alert error">{d.jira_error}</div>}
          </div>
        </Panel>
      ))}
    </div>
  );
}
function DefectEditor({ record, onClose, onSave, busy }) {
  const [d, setD] = useState(pick(record, DEFECT_KEYS)),
    [reviewer, setReviewer] = useState(record.reviewer || "Abdul");
  return (
    <div className="modal-backdrop">
      <section
        className="modal large"
        role="dialog"
        aria-modal="true"
        aria-label="Review defect"
      >
        <div className="modal-head">
          <h2>Review defect report</h2>
          <button aria-label="Close defect editor" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-content">
          <div className="grid two compact">
            {DEFECT_KEYS.map((k) => (
              <Label
                key={k}
                title={
                  pretty(k) + (Array.isArray(d[k]) ? " · one per line" : "")
                }
              >
                {["severity", "priority", "classification"].includes(k) ? (
                  <select
                    value={d[k]}
                    onChange={(e) => setD({ ...d, [k]: e.target.value })}
                  >
                    {(k === "severity"
                      ? ["Critical", "Major", "Minor", "Trivial"]
                      : k === "priority"
                        ? ["High", "Medium", "Low"]
                        : [
                            "Product defect hypothesis",
                            "Test defect hypothesis",
                            "Environment issue hypothesis",
                            "Injected demonstration failure",
                          ]
                    ).map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <textarea
                    rows={3}
                    value={Array.isArray(d[k]) ? d[k].join("\n") : d[k]}
                    onChange={(e) =>
                      setD({
                        ...d,
                        [k]: Array.isArray(d[k])
                          ? e.target.value.split("\n")
                          : e.target.value,
                      })
                    }
                  />
                )}
              </Label>
            ))}
          </div>
          <Label title="Reviewer">
            <input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            />
          </Label>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            icon={ShieldCheck}
            onClick={() => onSave({ defect: d, reviewer, approve: true })}
          >
            Save & approve defect
          </Button>
        </div>
      </section>
    </div>
  );
}
function Reports({ state, task, config, busy, inspect }) {
  const rows = state.rtm,
    covered = rows.filter((r) => r.designed > 0).length;
  return (
    <>
      <div className="report-hero">
        <div>
          <span className="eyebrow">QUALITY, WITH CONTEXT</span>
          <h2>
            {rows.length ? Math.round((covered / rows.length) * 100) : 0}%
            requirement design coverage
          </h2>
          <p>
            {covered} of {rows.length} analyzed requirements have at least one
            linked test. This is design coverage, not a pass rate.
          </p>
        </div>
        <div className="report-actions">
          <a className="btn" href="/api/export/report.html">
            <Download size={16} />
            Complete HTML report
          </a>
          <a className="btn secondary" href="/api/export/workspace.json">
            Workspace JSON
          </a>
        </div>
      </div>
      <Panel
        title="Requirement traceability matrix"
        subtitle="Track design, review and execution independently."
        action={
          <a className="btn secondary" href="/api/export/rtm.csv">
            <Download size={15} />
            Export RTM
          </a>
        }
      >
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Linked tests</th>
                  <th>Designed</th>
                  <th>Approved</th>
                  <th>Automatable</th>
                  <th>Executed</th>
                  <th>Passed</th>
                  <th>Design gap</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.requirement_id}>
                    <td className="title-cell">
                      <strong>{r.requirement}</strong>
                      <small>{r.requirement_id}</small>
                    </td>
                    <td className="mono">{r.test_ids.join(", ") || "—"}</td>
                    {[
                      "designed",
                      "approved",
                      "automatable",
                      "executed",
                      "passed",
                    ].map((k) => (
                      <td key={k}>{r[k]}</td>
                    ))}
                    <td>
                      <Badge>{r.gap}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon={GitBranch} title="Traceability builds as you work">
            Analyze requirements, generate cases and run reviewed tests to
            populate this matrix.
          </Empty>
        )}
      </Panel>
      <Panel
        title="AI-assisted test documentation"
        subtitle="A reviewable test plan and summary based on the current inventory."
        action={
          <Button
            icon={Sparkles}
            disabled={busy}
            onClick={() => task("/documentation", config)}
          >
            Generate documentation
          </Button>
        }
      >
        {state.documentation.length ? (
          <div className="panel-body">
            {state.documentation.slice(0, 1).map((d) => (
              <div key={d.id}>
                <p>{d.overview}</p>
                <div className="grid two compact">
                  {[
                    "scope",
                    "test_strategy",
                    "coverage_findings",
                    "risks_and_recommendations",
                  ].map((k) => (
                    <div key={k}>
                      <h3>{pretty(k)}</h3>
                      <List items={d[k]} />
                    </div>
                  ))}
                </div>
                <h3>Execution summary</h3>
                <p>{d.execution_summary}</p>
                <Provenance value={d.provenance} onInspect={inspect} />
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-body muted">
            Generate a summary after you have created tests or executed a suite.
          </div>
        )}
      </Panel>
      <Panel
        title="Audit trail"
        subtitle="Recorded reviews, generations, executions and Jira publications."
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Reference</th>
                <th>Detail</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td>{pretty(a.action)}</td>
                  <td className="mono">{a.target}</td>
                  <td>{a.detail}</td>
                  <td>{date(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
function SettingsPage({ settings, config, setConfig, act, setModal, busy }) {
  return (
    <>
      <div className="grid two">
        <Panel
          title="AI inference settings"
          subtitle="Choose the model in the top bar. Secrets stay on the backend."
        >
          <div className="panel-body">
            <Label
              title="Temperature"
              hint="0 is recommended for repeatable QA artifacts."
            >
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) =>
                  setConfig({ ...config, temperature: Number(e.target.value) })
                }
              />
            </Label>
            <Label
              title="Maximum output tokens"
              hint="Use 3,500–5,000 for 4 cases. Smaller batches are more reliable locally."
            >
              <input
                type="number"
                min="500"
                max="8000"
                step="500"
                value={config.max_tokens}
                onChange={(e) =>
                  setConfig({ ...config, max_tokens: Number(e.target.value) })
                }
              />
            </Label>
            <div className="setting-row">
              <span>Ollama endpoint</span>
              <code>{settings.ollama_url}</code>
            </div>
            <div className="setting-row">
              <span>Groq API key</span>
              <Badge tone={settings.groq_configured ? "green" : "amber"}>
                {settings.groq_configured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <Button
              variant="secondary"
              icon={RefreshCw}
              disabled={busy}
              onClick={() =>
                act(async () => {
                  const r = await api("/models/" + config.provider);
                  setModal({
                    title: "Available " + config.provider + " models",
                    data: r,
                  });
                })
              }
            >
              Check selected provider
            </Button>
            <div className="callout">
              <BookOpen size={18} />
              <p>
                Model discovery checks connectivity. Generate a small
                requirement analysis to verify actual inference and JSON
                validation.
              </p>
            </div>
          </div>
        </Panel>
        <Panel
          title="Jira Cloud integration"
          subtitle="Review a defect locally, then explicitly create an issue."
        >
          <div className="panel-body">
            <div className="setting-row">
              <span>Jira site</span>
              <code>{settings.jira_base_url || "Not configured"}</code>
            </div>
            <div className="setting-row">
              <span>Project</span>
              <strong>{settings.jira_project || "Not configured"}</strong>
            </div>
            <div className="setting-row">
              <span>Credentials</span>
              <Badge>
                {settings.jira_configured ? "Configured" : "Not configured"}
              </Badge>
            </div>
            <Button
              variant="secondary"
              icon={LinkIcon}
              disabled={busy}
              onClick={() =>
                act(async () => {
                  setModal({
                    title: "Jira connection result",
                    data: await api("/jira/check"),
                  });
                })
              }
            >
              Check Jira connection
            </Button>
            <h3>Configure in the root .env file</h3>
            <pre className="code-block">
              {
                "GROQ_API_KEY=your-key\nJIRA_BASE_URL=https://your-team.atlassian.net\nJIRA_EMAIL=you@example.com\nJIRA_API_TOKEN=your-token\nJIRA_PROJECT_KEY=QA\nJIRA_ISSUE_TYPE=Bug"
              }
            </pre>
            <p className="muted">
              Restart the backend after changing .env. Use a Jira Cloud API
              token; an account password will not work. Project-specific
              required fields may need adjustment in backend/app/jira.py.
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="How the workbench makes decisions">
        <div className="grid three panel-body">
          {[
            [
              ShieldCheck,
              "Review before execution",
              "AI cases remain drafts until a person verifies their source, data, expected behavior and adapter.",
            ],
            [
              BookOpen,
              "Evidence before answers",
              "Document answers cite retrieved excerpts. Citation checks cannot prove every claim is correct.",
            ],
            [
              Code2,
              "Controlled execution",
              "Browser actions use maintained page objects. AI script drafts are download-only and require code review.",
            ],
          ].map(([Icon, title, body]) => (
            <div className="principle" key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </Panel>
      <div className="callout amber">
        <TriangleAlert size={20} />
        <p>
          This is a local, single-user assessment application. Keep it bound to
          localhost. It has no multi-user authentication, distributed workers,
          malware scanning or production access controls.
        </p>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
