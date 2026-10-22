import { runBolt } from "../index";

let pendingInputResolve: ((value: string) => void) | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, source, value } = e.data;

  if (type === "RUN") {
    try {
      const result = await runBolt(
        source,
        (line: string) => {
          self.postMessage({ type: "OUTPUT", text: line });
        },
        {
          onInput: (prompt: string) => {
            return new Promise<string>((resolve) => {
              pendingInputResolve = resolve;
              self.postMessage({ type: "INPUT_REQUEST", prompt });
            });
          }
        }
      );

      self.postMessage({
        type: "DONE",
        output: result.output,
        error: result.error
      });
    } catch (err: any) {
      self.postMessage({
        type: "DONE",
        output: [],
        error: err.message || String(err)
      });
    }
  } else if (type === "INPUT_RESPONSE") {
    if (pendingInputResolve) {
      const resolve = pendingInputResolve;
      pendingInputResolve = null;
      resolve(value || "");
    }
  }
};
