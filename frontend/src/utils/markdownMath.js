/**
 * Shared Markdown + LaTeX (+ optional TikZ) pipeline.
 *
 * Used by past papers, revision notes, community shared notes and the admin
 * content editor so that what an author previews is exactly what students see.
 */
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { defaultUrlTransform } from 'react-markdown';
import 'katex/dist/katex.min.css';
// Registers \ce{} and \pu{} (chemical equations / units) on the shared KaTeX instance.
import 'katex/contrib/mhchem';

const TRUSTED_KATEX_COMMANDS = new Set(['\\href', '\\url', '\\includegraphics']);
const SAFE_PROTOCOLS = new Set(['http', 'https', 'mailto', '_relative']);

export const KATEX_OPTIONS = {
    throwOnError: false,
    strict: false,
    // Content can be user-written (community notes), so only link/image commands
    // with safe protocols are trusted — never `javascript:` URLs or raw HTML commands.
    trust: (context) => TRUSTED_KATEX_COMMANDS.has(context.command) && SAFE_PROTOCOLS.has(context.protocol),
};

export const REMARK_PLUGINS = [
    [remarkMath, { singleDollarTextMath: true }],
    remarkGfm,
];

export const REHYPE_PLUGINS = [
    [rehypeKatex, KATEX_OPTIONS],
];

/** Default react-markdown URL sanitising, plus the internal `input://` scheme used by past papers. */
export const paperUrlTransform = (url) => (url.startsWith('input://') ? url : defaultUrlTransform(url));

export { normalizeMarkdown } from './normalizeMarkdown';
