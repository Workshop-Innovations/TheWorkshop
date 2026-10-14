/**
 * TikZJax driver.
 *
 * TikZJax v1 only renders from `window.onload`: it scans the page once for
 * <script type="text/tikz"> elements and never looks again. In a single-page app the
 * diagrams arrive long after that, so they never rendered. This module loads the script
 * once, takes its renderer off `window.onload`, and feeds it one diagram at a time,
 * caching the resulting SVG so revisiting a topic is instant.
 */

const SCRIPT_URL = 'https://tikzjax.com/v1/tikzjax.js';
const FONTS_URL = 'https://tikzjax.com/v1/fonts.css';
// The first render downloads the TeX engine (several MB), so it gets a longer budget.
const FIRST_RENDER_TIMEOUT_MS = 120000;
const RENDER_TIMEOUT_MS = 45000;

const cache = new Map();    // prepared source -> rendered HTML
const inflight = new Map(); // prepared source -> Promise<string>
let enginePromise = null;
let queue = Promise.resolve();
let hasRendered = false;

/**
 * Makes author-written TikZ compile inside TikZJax, which wraps the source in
 * \begin{document}…\end{document} itself and only ships the packages preloaded in its
 * engine (a \usepackage line is either redundant or fails to load).
 */
export function prepareTikzSource(raw) {
    let source = String(raw ?? '').replace(/\r\n?/g, '\n');
    source = source
        .replace(/^[ \t]*\\(?:documentclass|usepackage)(?:\[[^\]\n]*\])?\{[^}\n]*\}[ \t]*$/gm, '')
        .replace(/\\(?:begin|end)\s*\{document\}/g, '')
        .trim();
    if (!source) return '';
    if (!/\\begin\s*\{/.test(source)) {
        source = `\\begin{tikzpicture}\n${source}\n\\end{tikzpicture}`;
    }
    return source;
}

export const getCachedTikz = (source) => cache.get(source);

function loadEngine() {
    if (enginePromise) return enginePromise;

    enginePromise = new Promise((resolve, reject) => {
        if (!document.getElementById('tikzjax-fonts')) {
            const link = document.createElement('link');
            link.id = 'tikzjax-fonts';
            link.rel = 'stylesheet';
            link.href = FONTS_URL;
            document.head.appendChild(link);
        }

        const previousOnload = window.onload;
        const script = document.createElement('script');
        script.id = 'tikzjax-script';
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => {
            const render = window.onload;
            // Hand window.onload back so the browser's load event can never start a
            // second, overlapping render of the same elements.
            window.onload = previousOnload;
            if (typeof render === 'function' && render !== previousOnload) {
                resolve(render);
            } else {
                reject(new Error('The diagram engine failed to start.'));
            }
        };
        script.onerror = () => {
            script.remove();
            reject(new Error('Could not load the diagram engine. Check your connection and try again.'));
        };
        document.head.appendChild(script);
    });

    // Allow a retry after a failed load (e.g. the user was offline).
    enginePromise.catch(() => { enginePromise = null; });
    return enginePromise;
}

/** Renders one diagram. Only one text/tikz script is ever in the document at a time. */
function runRender(render, source) {
    return new Promise((resolve, reject) => {
        const stage = document.createElement('div');
        stage.setAttribute('aria-hidden', 'true');
        stage.style.cssText = 'position:absolute;left:-99999px;top:0;';
        const script = document.createElement('script');
        script.type = 'text/tikz';
        script.textContent = source;
        stage.appendChild(script);

        let settled = false;
        let observer = null;
        let timer = null;
        const onRejection = () => {
            // TikZJax does not report compile errors; they surface as an unhandled rejection.
            finish(reject, new Error('This diagram could not be compiled. Check the TikZ code.'));
        };
        const finish = (settle, value) => {
            if (settled) return;
            settled = true;
            observer?.disconnect();
            clearTimeout(timer);
            window.removeEventListener('unhandledrejection', onRejection);
            stage.remove();
            settle(value);
        };

        observer = new MutationObserver(() => {
            if (script.isConnected) return;
            // TikZJax replaces the script element with the rendered diagram.
            const html = stage.innerHTML;
            if (html.includes('<svg')) finish(resolve, html);
            else finish(reject, new Error('This diagram could not be rendered.'));
        });
        observer.observe(stage, { childList: true });
        window.addEventListener('unhandledrejection', onRejection);
        timer = setTimeout(
            () => finish(reject, new Error('Rendering the diagram timed out.')),
            hasRendered ? RENDER_TIMEOUT_MS : FIRST_RENDER_TIMEOUT_MS,
        );

        document.body.appendChild(stage);
        try {
            Promise.resolve(render()).catch((err) => finish(reject, err));
        } catch (err) {
            finish(reject, err);
        }
    });
}

/**
 * Renders prepared TikZ source to SVG markup. Renders are queued because TikZJax runs a
 * single TeX engine; identical sources share one render and are cached.
 */
export function renderTikz(source) {
    if (cache.has(source)) return Promise.resolve(cache.get(source));
    if (inflight.has(source)) return inflight.get(source);

    const job = queue.then(async () => {
        const render = await loadEngine();
        const html = await runRender(render, source);
        hasRendered = true;
        cache.set(source, html);
        return html;
    });

    const cleanup = () => inflight.delete(source);
    queue = job.then(cleanup, cleanup);
    inflight.set(source, job);
    return job;
}
