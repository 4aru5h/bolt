import React, { useState, useEffect, useRef } from "react";
import { Editor } from "./Editor";
import { Output } from "./Output";
import { Guide } from "./Guide";
import { EXAMPLES } from "./examples";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"editor" | "guide">("editor");
  const [mobilePanel, setMobilePanel] = useState<"code" | "output">("code");
  const [code, setCode] = useState<string>("# check out the guide above!\n");
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const initWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    const worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module"
    });

    worker.onmessage = (e: MessageEvent) => {
      const { type, text, prompt, error: runError } = e.data;
      if (type === "OUTPUT") {
        setLogs((prev) => [...prev, text]);
      } else if (type === "INPUT_REQUEST") {
        setWaitingForInput(true);
        setInputPrompt(prompt || "");
        if (window.innerWidth < 768) {
          setMobilePanel("output");
        }
      } else if (type === "DONE") {
        setIsRunning(false);
        setWaitingForInput(false);
        if (runError) {
          setError(runError);
        }
      }
    };

    worker.onerror = (e) => {
      setIsRunning(false);
      setWaitingForInput(false);
      setError(`Worker error: ${e.message}`);
    };

    workerRef.current = worker;
  };

  useEffect(() => {
    initWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleRun = () => {
    setLogs([]);
    setError(null);
    setIsRunning(true);
    setWaitingForInput(false);
    setInputPrompt("");

    // Automatically flip to output on mobile so the user sees results/input prompt
    if (isMobile) {
      setMobilePanel("output");
    }

    initWorker();
    workerRef.current?.postMessage({ type: "RUN", source: code });
  };

  const handleStop = () => {
    if (workerRef.current && isRunning) {
      workerRef.current.terminate();
      setIsRunning(false);
      setWaitingForInput(false);
      setError("Process terminated by user.");
      initWorker();
    }
  };

  const handleSubmitInput = (val: string) => {
    if (workerRef.current && waitingForInput) {
      const promptLabel = inputPrompt ? inputPrompt : "> ";
      setLogs((prev) => [...prev, `${promptLabel}${val}`]);
      setWaitingForInput(false);
      setInputPrompt("");
      workerRef.current.postMessage({ type: "INPUT_RESPONSE", value: val });
    }
  };

  const handleSelectExample = (exampleId: string) => {
    const ex = EXAMPLES.find((e) => e.id === exampleId);
    if (ex) {
      setCode(ex.code);
      setLogs([]);
      setError(null);
      setWaitingForInput(false);
      setActiveTab("editor");
      if (isMobile) {
        setMobilePanel("code");
      }
    }
  };

  const handleLoadSnippet = (snippet: string) => {
    setCode(snippet);
    setLogs([]);
    setError(null);
    setWaitingForInput(false);
    setActiveTab("editor");
    if (isMobile) {
      setMobilePanel("code");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#181818",
        color: "#cccccc",
        overflow: "hidden"
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          padding: isMobile ? "8px 10px" : "6px 14px",
          background: "#1e1e1e",
          borderBottom: "1px solid #2d2d2d",
          fontSize: "13px"
        }}
      >
        {/* Left: Brand + Navigation tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: "bold", fontFamily: "monospace", color: "#ffffff", fontSize: "14px" }}>
            bolt
          </span>

          <nav style={{ display: "flex", gap: 2 }}>
            <button
              onClick={() => setActiveTab("editor")}
              style={{
                background: activeTab === "editor" ? "#2d2d2d" : "transparent",
                color: activeTab === "editor" ? "#ffffff" : "#888888",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "12px",
                minHeight: "32px"
              }}
            >
              editor
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              style={{
                background: activeTab === "guide" ? "#2d2d2d" : "transparent",
                color: activeTab === "guide" ? "#ffffff" : "#888888",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "12px",
                minHeight: "32px"
              }}
            >
              guide
            </button>
          </nav>
        </div>

        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <select
            onChange={(e) => handleSelectExample(e.target.value)}
            defaultValue=""
            style={{
              background: "#141414",
              color: "#cccccc",
              border: "1px solid #333333",
              padding: "5px 8px",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none",
              maxWidth: isMobile ? "130px" : "180px",
              minHeight: "32px"
            }}
          >
            <option value="" disabled>
              load example...
            </option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning && !waitingForInput}
            style={{
              background: isRunning && !waitingForInput ? "#254e28" : "#2e7d32",
              color: "#ffffff",
              border: "1px solid #1b5e20",
              padding: "5px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: isRunning && !waitingForInput ? "not-allowed" : "pointer",
              minHeight: "32px"
            }}
          >
            Run
          </button>

          <button
            onClick={handleStop}
            disabled={!isRunning}
            style={{
              background: isRunning ? "#b71c1c" : "#2d2d2d",
              color: isRunning ? "#ffffff" : "#555555",
              border: "1px solid #333333",
              padding: "5px 12px",
              fontSize: "12px",
              cursor: isRunning ? "pointer" : "not-allowed",
              minHeight: "32px"
            }}
          >
            Stop
          </button>
        </div>
      </header>

      {/* Mobile-only Code / Output sub-tab switcher */}
      {activeTab === "editor" && isMobile && (
        <div
          style={{
            display: "flex",
            background: "#141414",
            borderBottom: "1px solid #2d2d2d",
            fontSize: "12px"
          }}
        >
          <button
            onClick={() => setMobilePanel("code")}
            style={{
              flex: 1,
              padding: "8px 0",
              background: mobilePanel === "code" ? "#222222" : "#141414",
              color: mobilePanel === "code" ? "#ffffff" : "#777777",
              border: "none",
              borderBottom: mobilePanel === "code" ? "2px solid #38bdf8" : "2px solid transparent",
              fontWeight: mobilePanel === "code" ? "bold" : "normal",
              cursor: "pointer"
            }}
          >
            Code
          </button>
          <button
            onClick={() => setMobilePanel("output")}
            style={{
              flex: 1,
              padding: "8px 0",
              background: mobilePanel === "output" ? "#222222" : "#141414",
              color: mobilePanel === "output" ? "#ffffff" : "#777777",
              border: "none",
              borderBottom: mobilePanel === "output" ? "2px solid #38bdf8" : "2px solid transparent",
              fontWeight: mobilePanel === "output" ? "bold" : "normal",
              cursor: "pointer"
            }}
          >
            Output {logs.length > 0 ? `(${logs.length})` : ""} {waitingForInput ? "●" : ""}
          </button>
        </div>
      )}

      {/* Main Area */}
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {activeTab === "editor" ? (
          isMobile ? (
            /* Mobile View: Show either Code or Output full-screen */
            <div style={{ height: "100%", width: "100%" }}>
              <div style={{ display: mobilePanel === "code" ? "block" : "none", height: "100%" }}>
                <Editor value={code} onChange={setCode} onRun={handleRun} />
              </div>
              <div style={{ display: mobilePanel === "output" ? "block" : "none", height: "100%" }}>
                <Output
                  logs={logs}
                  error={error}
                  isRunning={isRunning}
                  waitingForInput={waitingForInput}
                  inputPrompt={inputPrompt}
                  onSubmitInput={handleSubmitInput}
                  onClear={() => {
                    setLogs([]);
                    setError(null);
                  }}
                />
              </div>
            </div>
          ) : (
            /* Desktop View: Side-by-side */
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", height: "100%" }}>
              <Editor value={code} onChange={setCode} onRun={handleRun} />
              <Output
                logs={logs}
                error={error}
                isRunning={isRunning}
                waitingForInput={waitingForInput}
                inputPrompt={inputPrompt}
                onSubmitInput={handleSubmitInput}
                onClear={() => {
                  setLogs([]);
                  setError(null);
                }}
              />
            </div>
          )
        ) : (
          /* Guide Tab */
          <div style={{ height: "100%", overflowY: "auto", background: "#181818" }}>
            <Guide onLoadSnippet={handleLoadSnippet} />
          </div>
        )}
      </main>
    </div>
  );
};
