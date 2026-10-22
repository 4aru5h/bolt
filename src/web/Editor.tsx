import React, { useRef } from "react";
import MonacoEditor, { Monaco } from "@monaco-editor/react";

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, onRun }) => {
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;

    if (!monaco.languages.getLanguages().some((l) => l.id === "bolt")) {
      monaco.languages.register({ id: "bolt" });

      monaco.languages.setMonarchTokensProvider("bolt", {
        keywords: [
          "let",
          "if",
          "elif",
          "else",
          "while",
          "for",
          "in",
          "repeat",
          "loop",
          "break",
          "continue",
          "give",
          "def",
          "and",
          "or",
          "not",
          "true",
          "false",
          "none"
        ],
        builtins: ["len", "push", "pop", "emit"],
        operators: [
          "=",
          "+=",
          "-=",
          "*=",
          "/=",
          "==",
          "!=",
          "<",
          "<=",
          ">",
          ">=",
          "+",
          "-",
          "*",
          "/",
          "//",
          "%",
          "**",
          ".."
        ],
        tokenizer: {
          root: [
            [/#.*$/, "comment"],
            [
              /[a-zA-Z_]\w*/,
              {
                cases: {
                  "@keywords": "keyword",
                  "@builtins": "predefined",
                  "@default": "identifier"
                }
              }
            ],
            [/\d*\.\d+/, "number.float"],
            [/\d+/, "number"],
            [/"([^"\\]|\\.)*"/, "string"],
            [/[{}()\[\];,]/, "delimiter"]
          ]
        }
      });
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun();
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <MonacoEditor
        height="100%"
        language="bolt"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || "")}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily: "Consolas, 'Courier New', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 4,
          automaticLayout: true,
          renderLineHighlight: "line"
        }}
      />
    </div>
  );
};
