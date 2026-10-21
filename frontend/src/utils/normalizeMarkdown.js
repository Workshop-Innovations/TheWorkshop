const FENCE_OPEN = /^[ \t]*(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^[ \t]*(`{3,}|~{3,})[ \t]*$/;

function splitFencedCode(text) {
  const segments = [];
  let buffer = [];
  let fence = null;

  const flush = (type) => {
    if (buffer.length) segments.push({ type, value: buffer.join("\n") });
    buffer = [];
  };

  for (const line of text.split("\n")) {
    if (!fence) {
      const open = line.match(FENCE_OPEN);

      if (open && !(open[1][0] === "`" && open[2].includes("`"))) {
        flush("text");
        fence = { char: open[1][0], length: open[1].length };
      }
      buffer.push(line);
    } else {
      buffer.push(line);
      const close = line.match(FENCE_CLOSE);
      if (
        close &&
        close[1][0] === fence.char &&
        close[1].length >= fence.length
      ) {
        flush("code");
        fence = null;
      }
    }
  }
  flush(fence ? "code" : "text");
  return segments;
}

const mapTextSegments = (text, fn) =>
  splitFencedCode(text)
    .map((segment) =>
      segment.type === "text" ? fn(segment.value) : segment.value,
    )
    .join("\n");

// A bare \begin{tikzpicture}…\end{tikzpicture} at the start of a line, together with any
// \usepackage / \usetikzlibrary lines directly above it.
const BARE_TIKZ =
  /^([ \t]*)((?:\\use(?:tikzlibrary|package)(?:\[[^\]\n]*\])?\{[^}\n]*\}[ \t]*\n[ \t]*)*\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\})/gm;

function fenceBareTikz(text) {
  return text.replace(
    BARE_TIKZ,
    (_, indent, body) => `${indent}\`\`\`tikz\n${body}\n${indent}\`\`\`\n`,
  );
}

const isWhitespace = (ch) => ch === undefined || /\s/.test(ch);
const isDigit = (ch) => ch !== undefined && ch >= "0" && ch <= "9";

function isEscaped(s, i) {
  let backslashes = 0;
  for (let k = i - 1; k >= 0 && s[k] === "\\"; k--) backslashes++;
  return backslashes % 2 === 1;
}

function findUnescaped(s, token, from) {
  let j = s.indexOf(token, from);
  while (j !== -1 && isEscaped(s, j)) j = s.indexOf(token, j + 1);
  return j;
}

function leadingIndent(s, i) {
  const lineStart = s.lastIndexOf("\n", i - 1) + 1;
  const before = s.slice(lineStart, i);
  return /^[ \t]*$/.test(before) ? before : null;
}

function restOfLineIsBlank(s, i) {
  const end = s.indexOf("\n", i);
  return /^[ \t]*$/.test(s.slice(i, end === -1 ? s.length : end));
}

function displayBlock(inner, indent) {
  const body = inner
    .trim()
    .split("\n")
    .map((line) => indent + line.trimStart())
    .join("\n");
  return `$$\n${body}\n${indent}$$`;
}

function findInlineMathClose(s, open) {
  if (isWhitespace(s[open + 1]) || s[open + 1] === "$") return -1;
  for (let j = open + 1; j < s.length; j++) {
    if (s[j] === "\n" && /^\n[ \t]*\n/.test(s.slice(j, j + 64))) return -1;
    if (s[j] === "$" && !isEscaped(s, j)) {
      if (!isWhitespace(s[j - 1]) && !isDigit(s[j + 1])) return j;

      return -1;
    }
  }
  return -1;
}

const protectMathDollars = (math) =>
  math.replace(/(^|[^\\])((?:\\\\)*)\\\$/g, "$1$2{\\char36}");

function normalizeMathText(s) {
  let out = "";
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    if (ch === "\\") {
      const next = s[i + 1];
      if (next === "[" || next === "(") {
        const closeToken = next === "[" ? "\\]" : "\\)";
        const close = findUnescaped(s, closeToken, i + 2);
        if (close !== -1) {
          const inner = s.slice(i + 2, close);
          const indent = leadingIndent(s, i);
          const math = protectMathDollars(inner.trim());
          if (
            next === "[" &&
            indent !== null &&
            restOfLineIsBlank(s, close + 2)
          ) {
            out += displayBlock(math, indent);
          } else if (next === "[") {
            out += `$$${math}$$`;
          } else {
            out += `$${math}$`;
          }
          i = close + 2;
          continue;
        }
      }

      out += ch + (next ?? "");
      i += 2;
      continue;
    }

    if (ch === "`") {
      let runEnd = i;
      while (s[runEnd] === "`") runEnd++;
      const run = s.slice(i, runEnd);
      let search = runEnd;
      let close = -1;
      while ((search = s.indexOf(run, search)) !== -1) {
        if (s[search - 1] !== "`" && s[search + run.length] !== "`") {
          close = search;
          break;
        }
        search += run.length;
      }
      const end = close === -1 ? runEnd : close + run.length;
      out += s.slice(i, end);
      i = end;
      continue;
    }

    if (ch === "$") {
      if (s[i + 1] === "$") {
        const close = findUnescaped(s, "$$", i + 2);
        if (close === -1) {
          out += "$$";
          i += 2;
          continue;
        }
        const inner = s.slice(i + 2, close);
        const indent = leadingIndent(s, i);
        if (
          indent !== null &&
          restOfLineIsBlank(s, close + 2) &&
          !/\n[ \t]*\n/.test(inner)
        ) {
          out += displayBlock(protectMathDollars(inner), indent);
        } else {
          out += `$$${protectMathDollars(inner)}$$`;
        }
        i = close + 2;
        continue;
      }

      const close = findInlineMathClose(s, i);
      if (close !== -1) {
        out += `$${protectMathDollars(s.slice(i + 1, close))}$`;
        i = close + 1;
      } else {
        out += "\\$";
        i += 1;
      }
      continue;
    }

    out += ch;
    i += 1;
  }
  return out;
}

/**
 * Normalises stored Markdown so every supported LaTeX style renders correctly.
 * @param {string} raw
 * @param {{ tikz?: boolean }} [options] tikz: also turn bare tikzpicture environments into ```tikz blocks
 */
export function normalizeMarkdown(raw, { tikz = false } = {}) {
  if (!raw) return "";
  let text = raw.replace(/\r\n?/g, "\n");
  if (tikz) text = mapTextSegments(text, fenceBareTikz);
  return mapTextSegments(text, normalizeMathText);
}
