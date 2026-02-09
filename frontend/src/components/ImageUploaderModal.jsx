import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, compressImage } from '../utils/imageUtils';
import { FaCloudUploadAlt, FaTimes, FaSave, FaMinus, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ImageUploaderModal = ({ isOpen, onClose, onSave }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result));
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
            const compressedImage = await compressImage(croppedImageBase64, 500); // Max 500KB
            onSave(compressedImage);
            onClose();
            // Reset state
            setImageSrc(null);
            setZoom(1);
        } catch (e) {
            console.error(e);
            setError("Failed to process image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Update Profile Picture</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-grow flex flex-col items-center justify-center bg-slate-50 relative min-h-[300px]">
                            {imageSrc ? (
                                <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-lg overflow-hidden shadow-inner">
                                    <Cropper
                                        image={imageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-4xl border-2 border-dashed border-slate-300">
                                        <FaCloudUploadAlt />
                                    </div>
                                    <p className="text-slate-600 font-medium mb-2">Select an image to upload</p>
                                    <p className="text-xs text-slate-400">JPG, PNG supported.</p>
                                    <label className="mt-6 inline-block cursor-pointer">
                                        <span className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200">
                                            Choose File
                                        </span>
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>
                            )}

                            {imageSrc && (
                                <div className="w-full mt-6 px-4">
                                    <div className="flex items-center gap-4 text-slate-500">
                                        <FaMinus className="text-xs" />
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            aria-labelledby="Zoom"
                                            onChange={(e) => setZoom(e.target.value)}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <FaPlus className="text-xs" />
                                    </div>
                                </div>
                            )}
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            {imageSrc && (
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    {loading ? 'Processing...' : <><FaSave /> Save Picture</>}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ImageUploaderModal;
