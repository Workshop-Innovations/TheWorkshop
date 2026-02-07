import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { FaSave, FaTimes, FaMarkdown } from 'react-icons/fa';

const ContentEditor = ({ initialValue = '', onSave, onCancel, title = 'Editor' }) => {
    const [content, setContent] = useState(initialValue);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        setContent(initialValue);
    }, [initialValue]);

    const handleSave = () => {
        onSave(content);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[80vh] w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <h3 className="font-bold text-slate-700 flex items-center">
                    <FaMarkdown className="mr-2 text-primary" /> {title}
                </h3>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isPreview
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {isPreview ? 'Switch to Edit' : 'Switch to Preview'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-md shadow-primary/20 transition-colors flex items-center"
                    >
                        <FaSave className="mr-2" /> Save
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
                        <span>Markdown & LaTeX supported</span>
                        <span>{content.length} chars</span>
                    </div>
                </div>

                {/* Vertical Divider (Desktop) */}
                <div className="hidden md:block w-px bg-slate-200"></div>

                {/* Preview Output */}
                <div className={`flex-1 bg-slate-50 overflow-y-auto p-6 prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-primary ${!isPreview ? 'hidden md:block' : 'block'}`}>
                    {content ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    return (
                                        <code className={`${className} bg-slate-200 px-1 py-0.5 rounded text-sm`} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {content}
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
