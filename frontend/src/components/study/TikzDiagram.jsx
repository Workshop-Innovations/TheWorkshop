import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import {
  prepareTikzSource,
  renderTikz,
  getCachedTikz,
} from "../../utils/tikzjax.js";

/**
 * Renders TikZ source as an SVG diagram via TikZJax.
 * The output node is never given React children: TikZJax's SVG is written into it directly.
 */
const TikzDiagram = ({ source }) => {
  const outputRef = useRef(null);
  const prepared = prepareTikzSource(source);
  const [status, setStatus] = useState(() =>
    getCachedTikz(prepared) ? "done" : "loading",
  );
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!prepared) return undefined;
    let cancelled = false;
    const cached = getCachedTikz(prepared);

    if (cached) {
      if (outputRef.current) outputRef.current.innerHTML = cached;
      setStatus("done");
      return undefined;
    }

    if (outputRef.current) outputRef.current.innerHTML = "";
    setStatus("loading");
    setError(null);
    renderTikz(prepared)
      .then((html) => {
        if (cancelled || !outputRef.current) return;
        outputRef.current.innerHTML = html;
        setStatus("done");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "This diagram could not be rendered.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [prepared, attempt]);

  if (!prepared) return null;

  return (
    <div className="tikz-diagram not-prose my-6 bg-white border border-slate-200 rounded-md shadow-sm p-4 sm:p-6 overflow-x-auto">
      <style>{`
                .tikz-output > div { max-width: 100%; height: auto !important; margin: 0 auto; }
                .tikz-output svg { max-width: 100%; height: auto; }
            `}</style>
      <div ref={outputRef} className="tikz-output flex justify-center" />

      {status === "loading" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-400">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Rendering diagram…
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="text-left">
          <div className="flex items-start gap-3 text-slate-600">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">
                Diagram unavailable
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
          <details className="mt-3">
            <summary className="text-xs font-bold text-slate-400 cursor-pointer hover:text-slate-600">
              Show TikZ source
            </summary>
            <pre className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-md text-xs text-slate-700 overflow-x-auto whitespace-pre">
              {source}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

const TIKZ_LANGUAGES = new Set(["language-tikz", "language-tikzpicture"]);

const codeText = (children) =>
  React.Children.toArray(children)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : "",
    )
    .join("");

/** react-markdown `pre` renderer: ```tikz blocks become diagrams, everything else stays code. */
// eslint-disable-next-line no-unused-vars -- `node` must not be spread onto the DOM element
export function TikzAwarePre({ node, children, ...props }) {
  const code = React.Children.toArray(children)[0];
  if (React.isValidElement(code)) {
    const classes = String(code.props.className || "").split(/\s+/);
    if (classes.some((c) => TIKZ_LANGUAGES.has(c))) {
      return <TikzDiagram source={codeText(code.props.children)} />;
    }
  }
  return <pre {...props}>{children}</pre>;
}

export default TikzDiagram;
