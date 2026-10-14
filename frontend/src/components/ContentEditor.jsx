import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Save, X, FileType2, Upload } from 'lucide-react';
import { TikzAwarePre } from './TikzDiagram';
import { REMARK_PLUGINS, REHYPE_PLUGINS, normalizeMarkdown } from '../utils/markdownMath';

// eslint-disable-next-line no-unused-vars -- `node` must not be spread onto the DOM element
const PreviewCode = ({ node, className, children, ...props }) => (
    <code className={`${className || ''} bg-slate-200 px-1 py-0.5 rounded text-sm`} {...props}>
        {children}
    </code>
);

/**
 * Markdown + LaTeX editor with a live preview that uses the same pipeline students see.
 * enableTikz: render ```tikz blocks / tikzpicture environments (revision notes).
 */
const ContentEditor = ({ initialValue = '', onSave, onCancel, title = 'Editor', enableTikz = false }) => {
    const [content, setContent] = useState(initialValue);
    const [debouncedContent, setDebouncedContent] = useState(initialValue);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        setContent(initialValue);
        setDebouncedContent(initialValue);
    }, [initialValue]);

    // Debounce the content for preview to avoid lag
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedContent(content);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [content]);

    const previewMarkdown = useMemo(
        () => normalizeMarkdown(debouncedContent, { tikz: enableTikz }),
        [debouncedContent, enableTikz]
    );
    const previewComponents = useMemo(
        () => (enableTikz ? { code: PreviewCode, pre: TikzAwarePre } : { code: PreviewCode }),
        [enableTikz]
    );

    const handleSave = () => {
        onSave(content);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            setContent(evt.target.result);
        };
        reader.readAsText(file);
        
        // Reset input so the same file can be uploaded again if needed
        e.target.value = null;
    };

    return (
        <div className="bg-white rounded-md shadow-lg border border-slate-200 flex flex-col h-[80vh] w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-md">
                <h3 className="font-bold text-slate-700 flex items-center">
                    <FileType2 className="mr-2 text-primary" /> {title}
                </h3>
                <div className="flex space-x-2">
                    <label className="cursor-pointer px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 rounded-md transition-colors flex items-center">
                        <Upload className="w-4 h-4 mr-1" /> Upload .md
                        <input 
                            type="file" 
                            accept=".md,.txt" 
                            className="hidden" 
                            onChange={handleFileUpload} 
                        />
                    </label>
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isPreview
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {isPreview ? 'Switch to Edit' : 'Switch to Preview'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-md shadow-md shadow-primary/20 transition-colors flex items-center"
                    >
                        <Save className="mr-2" /> Save
                    </button>
                </div>
            </div>

            {/* Editor/Preview Area */}
            <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
                {/* Editor Input */}
                <div className={`flex-1 flex flex-col ${isPreview ? 'hidden md:flex' : 'flex'}`}>
                    <textarea
                        className="flex-grow w-full p-4 resize-none focus:outline-none font-mono text-sm text-slate-800 bg-white"
                        placeholder="# Start typing your markdown content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                        <span>{enableTikz ? "Markdown, LaTeX & TikZ supported" : "Markdown & LaTeX supported"}</span>
                        <span>{content.length} chars</span>
                    </div>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block w-px bg-slate-200"></div>

                {/* Preview Output */}
                <div className={`flex-1 bg-slate-50 overflow-y-auto p-6 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-primary ${!isPreview ? 'hidden md:block' : 'block'}`}>
                    {debouncedContent ? (
                        <ReactMarkdown
                            remarkPlugins={REMARK_PLUGINS}
                            rehypePlugins={REHYPE_PLUGINS}
                            components={previewComponents}
                        >
                            {previewMarkdown}
                        </ReactMarkdown>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">
                            Preview area
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentEditor;
