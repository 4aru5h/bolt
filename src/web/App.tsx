import React, { useState, useEffect, useRef } from "react";
import { Editor } from "./Editor";
import { Output } from "./Output";
import { Guide } from "./Guide";
import { EXAMPLES } from "./examples";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"editor" | "guide">("editor");
  const [code, setCode] = useState<string>("# check out the guide above!\n");
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false);
  const [inputPrompt, setInputPrompt] = useState<string>("");

  const workerRef = useRef<Worker | null>(null);

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
    }
  };

  const handleLoadSnippet = (snippet: string) => {
    setCode(snippet);
    setLogs([]);
    setError(null);
    setWaitingForInput(false);
    setActiveTab("editor");
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
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px",
          background: "#1e1e1e",
          borderBottom: "1px solid #2d2d2d",
          fontSize: "13px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontWeight: "bold", fontFamily: "monospace", color: "#ffffff" }}>
            bolt
          </span>

          <nav style={{ display: "flex", gap: 2 }}>
            <button
              onClick={() => setActiveTab("editor")}
              style={{
                background: activeTab === "editor" ? "#2d2d2d" : "transparent",
                color: activeTab === "editor" ? "#ffffff" : "#888888",
                border: "none",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px"
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
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              guide
            </button>
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            onChange={(e) => handleSelectExample(e.target.value)}
            defaultValue=""
            style={{
              background: "#141414",
              color: "#cccccc",
              border: "1px solid #333333",
              padding: "3px 8px",
              fontSize: "12px",
              cursor: "pointer",
              outline: "none"
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
              padding: "3px 12px",
              fontSize: "12px",
              cursor: isRunning && !waitingForInput ? "not-allowed" : "pointer"
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
              padding: "3px 12px",
              fontSize: "12px",
              cursor: isRunning ? "pointer" : "not-allowed"
            }}
          >
            Stop
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {activeTab === "editor" ? (
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
        ) : (
          <div style={{ height: "100%", overflowY: "auto", background: "#181818" }}>
            <Guide onLoadSnippet={handleLoadSnippet} />
          </div>
        )}
      </main>
    </div>
  );
};
