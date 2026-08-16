import React, { useState, useEffect } from 'react';
import { X, UploadCloud, CheckCircle, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const DiagramManagerModal = ({ isOpen, onClose, paper, accessToken, onDiagramUploaded }) => {
    const [missingDiagrams, setMissingDiagrams] = useState([]);
    const [uploadedDiagrams, setUploadedDiagrams] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isOpen && paper) {
            parsePaperContent();
        }
    }, [isOpen, paper, paper?.content]);

    const parsePaperContent = () => {
        if (!paper || !paper.content) {
            setMissingDiagrams([]);
            setUploadedDiagrams([]);
            return;
        }

        const content = paper.content;
        
        // Find missing placeholders: [DIAGRAM:label] NOT preceded by !
        // We use a safer regex to avoid negative lookbehind `(?<!\!)` which crashes Safari < 16.4
        const missingRegex = /(?:^|[^\!])\[DIAGRAM:([^\]]+)\]/g;
        const missing = [];
        let match;
        while ((match = missingRegex.exec(content)) !== null) {
            missing.push(match[1]);
        }
        
        // Find uploaded placeholders: ![DIAGRAM:label](url)
        const uploadedRegex = /\!\[DIAGRAM:([^\]]+)\]\(([^)]+)\)/g;
        const uploaded = [];
        while ((match = uploadedRegex.exec(content)) !== null) {
            uploaded.push({ label: match[1], url: match[2] });
        }

        // Remove duplicates
        setMissingDiagrams([...new Set(missing)]);
        
        // For uploaded, keep unique labels
        const uniqueUploaded = [];
        const seenLabels = new Set();
        for (const item of uploaded) {
            if (!seenLabels.has(item.label)) {
                seenLabels.add(item.label);
                uniqueUploaded.push(item);
            }
        }
        setUploadedDiagrams(uniqueUploaded);
    };

    const handleUpload = async (e, placeholder) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await axios.post(
                `${baseUrl}/api/v1/papers/${paper.id}/diagram/${placeholder}`,
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${accessToken}`
                        // NOTE: Do NOT set Content-Type here. Axios auto-sets it to
                        // multipart/form-data WITH the boundary when FormData is passed.
                    }
                }
            );
            
            // Notify parent to fetch paper data again
            if (onDiagramUploaded) {
                onDiagramUploaded(response.data.url, placeholder);
            }
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload diagram.");
        } finally {
            setUploading(false);
            e.target.value = null; // reset input
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in relative">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Manage Diagrams</h3>
                        <p className="text-sm text-slate-500">Paper: {paper?.title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
                    >
                        <X />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {/* Missing Diagrams Section */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs mr-2">Missing</span>
                            Required Diagrams ({missingDiagrams.length})
                        </h4>
                        
                        {missingDiagrams.length === 0 ? (
                            <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                No missing diagrams found in the markdown.
                            </p>
                        ) : (
                            <div className="grid gap-3">
                                {missingDiagrams.map((placeholder) => (
                                    <div key={placeholder} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="flex items-center">
                                            <ImageIcon className="text-slate-400 mr-3" />
                                            <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                                [DIAGRAM:{placeholder}]
                                            </span>
                                        </div>
                                        <div>
                                            <label className={`cursor-pointer px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <UploadCloud className="inline w-4 h-4 mr-1" />
                                                Upload
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => handleUpload(e, placeholder)}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Uploaded Diagrams Section */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs mr-2">Uploaded</span>
                            Resolved Diagrams ({uploadedDiagrams.length})
                        </h4>
                        
                        {uploadedDiagrams.length === 0 ? (
                            <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                No diagrams have been uploaded yet.
                            </p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {uploadedDiagrams.map((item) => (
                                    <div key={item.label} className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                        <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center">
                                            <span className="font-mono text-xs text-slate-600 truncate mr-2">
                                                {item.label}
                                            </span>
                                            <CheckCircle className="text-green-500 w-4 h-4 flex-shrink-0" />
                                        </div>
                                        <div className="p-4 flex-grow flex items-center justify-center bg-slate-50">
                                            {/* Note: In a real app, you might need to prepend the API base URL if the image URL is relative and served by the backend, but since the frontend runs on a different port in dev, we should prepend VITE_API_URL */}
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.url}`} 
                                                alt={item.label} 
                                                className="max-h-32 object-contain rounded"
                                            />
                                        </div>
                                        <div className="p-2 border-t border-slate-200 bg-white">
                                            <label className={`cursor-pointer w-full text-center block px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                Replace Image
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={(e) => handleUpload(e, item.label)}
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagramManagerModal;
