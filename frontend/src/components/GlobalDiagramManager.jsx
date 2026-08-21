import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Image as ImageIcon, CheckCircle } from 'lucide-react';

const GlobalDiagramManager = ({ papers, accessToken, onUploadSuccess }) => {
    const [missingDiagrams, setMissingDiagrams] = useState([]);
    
    useEffect(() => {
        const missing = [];
        papers.forEach(paper => {
            if (!paper.content) return;
            const regex = /(?:^|[^\!])\[DIAGRAM:([^\]]+)\]/g;
            let match;
            const seen = new Set();
            while ((match = regex.exec(paper.content)) !== null) {
                const label = match[1];
                if (!seen.has(label)) {
                    seen.add(label);
                    missing.push({
                        paperId: paper.id,
                        paperTitle: paper.title,
                        label: label
                    });
                }
            }
        });
        setMissingDiagrams(missing);
    }, [papers]);

    // Remove a single uploaded diagram from local state immediately —
    // no full re-fetch needed (backend already updated the DB).
    // This keeps the list order stable and avoids the loading flash.
    const handleDiagramUploaded = (paperId, label) => {
        setMissingDiagrams(prev => prev.filter(
            d => !(d.paperId === paperId && d.label === label)
        ));
        // Notify parent silently in background so it can sync if needed,
        // but don't let it cause a loading spinner.
        if (onUploadSuccess) onUploadSuccess();
    };

    if (missingDiagrams.length === 0) {
        return (
            <div className="bg-white p-8 rounded-md shadow-sm border border-slate-200 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-slate-800">All caught up!</h3>
                <p className="text-slate-500">There are no missing diagrams in any of your past papers.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800">Missing Diagrams ({missingDiagrams.length})</h3>
                    <p className="text-sm text-slate-500">Drag and drop, paste from clipboard, or click to upload.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {missingDiagrams.map(diagram => (
                    <DiagramDropzone 
                        key={`${diagram.paperId}-${diagram.label}`} 
                        diagram={diagram} 
                        accessToken={accessToken}
                        onSuccess={() => handleDiagramUploaded(diagram.paperId, diagram.label)}
                    />
                ))}
            </div>
        </div>
    );
};

const DiagramDropzone = ({ diagram, accessToken, onSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const dropRef = useRef(null);

    const handleUpload = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            await axios.post(
                `${baseUrl}/api/v1/papers/${diagram.paperId}/diagram/${diagram.label}`,
                formData,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            onSuccess(); // Refresh papers
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload diagram.");
        } finally {
            setUploading(false);
        }
    };

    // Drag events
    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    // Paste event
    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile();
                handleUpload(blob);
                e.preventDefault();
                break;
            }
        }
    };

    return (
        <div 
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onPaste={handlePaste}
            tabIndex={0} // Make focusable to capture paste events
            className={`relative group border-2 border-dashed rounded-md p-6 text-center outline-none transition-all cursor-pointer focus:border-primary focus:ring-4 focus:ring-primary/10 ${
                isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <label className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleUpload(e.target.files[0])}
                />
            </label>

            <ImageIcon className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-slate-400 group-hover:text-slate-500'}`} />
            
            <div className="mb-2">
                <span className="font-mono text-sm font-bold text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                    {diagram.label}
                </span>
            </div>
            
            <div className="text-xs font-semibold text-primary mb-3 line-clamp-1">
                {diagram.paperTitle}
            </div>
            
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <UploadCloud className="w-3 h-3" /> Click, drag, or <kbd className="mx-1 px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 font-mono text-[10px]">Ctrl+V</kbd>
            </div>

            {uploading && (
                <div className="absolute inset-0 bg-white/80 rounded-md flex items-center justify-center z-20 backdrop-blur-sm">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};

export default GlobalDiagramManager;
