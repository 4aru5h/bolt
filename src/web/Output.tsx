import React, { useState, useEffect, useRef } from "react";

interface OutputProps {
  logs: string[];
  error: string | null;
  isRunning: boolean;
  waitingForInput: boolean;
  inputPrompt: string;
  onSubmitInput: (value: string) => void;
  onClear: () => void;
}

export const Output: React.FC<OutputProps> = ({
  logs,
  error,
  isRunning,
  waitingForInput,
  inputPrompt,
  onSubmitInput,
  onClear
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (waitingForInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitInput(inputValue);
    setInputValue("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#141414",
        borderLeft: "1px solid #2d2d2d",
        fontFamily: "Consolas, 'Courier New', monospace",
        fontSize: "13px"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          background: "#1e1e1e",
          borderBottom: "1px solid #2d2d2d",
          minHeight: "36px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#888888", fontSize: "12px", textTransform: "uppercase" }}>
            Output
          </span>
          {waitingForInput ? (
            <span style={{ color: "#4ec9b0", fontSize: "11px" }}>
              (waiting for input...)
            </span>
          ) : isRunning ? (
            <span style={{ color: "#dcdcaa", fontSize: "11px" }}>
              (running...)
            </span>
          ) : null}
        </div>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "1px solid #333333",
            color: "#aaaaaa",
            padding: "4px 10px",
            fontSize: "12px",
            cursor: "pointer"
          }}
        >
          clear
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: 12,
          overflowY: "auto",
          color: "#d4d4d4",
          whiteSpace: "pre-wrap",
          lineHeight: 1.5,
          WebkitOverflowScrolling: "touch"
        }}
      >
        {logs.length === 0 && !error && !isRunning && (
          <div style={{ color: "#555555" }}>
            Ready. Press Run to execute.
          </div>
        )}

        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}

        {waitingForInput && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6
            }}
          >
            <span style={{ color: "#4ec9b0", fontWeight: "bold" }}>{inputPrompt || ">"}</span>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="type input and press enter..."
              style={{
                background: "#1c1c1c",
                border: "1px solid #444444",
                color: "#ffffff",
                padding: "6px 8px",
                fontFamily: "inherit",
                fontSize: "16px", // 16px prevents iOS Safari auto-zoom!
                flex: 1,
                outline: "none"
              }}
            />
          </form>
        )}

        {error && (
          <div
            style={{
              marginTop: logs.length > 0 ? 8 : 0,
              padding: "8px 10px",
              borderLeft: "2px solid #f44747",
              background: "#221515",
              color: "#f48771"
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
