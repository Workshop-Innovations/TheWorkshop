import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { getCroppedImg } from '../utils/imageUtils';
import { Camera, ImagePlus, CheckCircle2 } from 'lucide-react';

/**
 * ProfilePictureGate
 * Renders children normally if the user already has a profile picture.
 * Otherwise shows a full-screen blocking prompt to upload one.
 */
const ProfilePictureGate = ({ children }) => {
    const { profilePic, updateProfilePic, user } = useAuth();

    const [step, setStep] = useState('prompt'); // 'prompt' | 'crop' | 'saving'
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [error, setError] = useState('');

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    // If the user already has a profile picture, render children directly.
    // Must come after every hook: returning early before useCallback changed the hook
    // count when the picture was saved and crashed the page ("Rendered fewer hooks").
    if (profilePic) return children;

    const handleFileChange = (e) => {
        setError('');
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            setStep('crop');
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        setStep('saving');
        try {
            const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
            await updateProfilePic(cropped);
            // profilePic will now be truthy — the gate will unmount itself and render children
        } catch (err) {
            console.error('Crop error:', err);
            setError('Something went wrong. Please try again.');
            setStep('crop');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {step === 'prompt' && (
                    <div className="bg-white border border-slate-200 rounded-md shadow-lg p-10 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Camera size={32} />
                        </div>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Community Access</p>
                        <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                            One last step
                        </h1>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                            Before you join the community, add a profile picture so other members know who they're talking to.
                        </p>

                        {/* Upload trigger */}
                        <label className="block cursor-pointer">
                            <div className="flex items-center justify-center gap-3 w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-all active:scale-95 shadow-xl shadow-primary/20">
                                <ImagePlus size={20} />
                                Choose a Photo
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>

                        {error && <p className="text-red-500 text-xs mt-4">{error}</p>}

                        <p className="text-slate-400 text-xs mt-6 pt-6 border-t border-slate-100">
                            Hello, <span className="text-slate-700 font-semibold">{user?.username || user?.email?.split('@')[0]}</span> — your picture will be visible to all community members.
                        </p>
                    </div>
                )}

                {step === 'crop' && imageSrc && (
                    <div className="bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Position your photo</h2>
                        </div>

                        {/* Cropper */}
                        <div className="relative w-full bg-slate-900" style={{ height: 320 }}>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        {/* Zoom slider */}
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={e => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-slate-200 rounded-md appearance-none cursor-pointer accent-primary"
                            />
                            <p className="text-slate-400 text-xs text-center mt-2">Drag to position · Scroll to zoom</p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={() => { setStep('prompt'); setImageSrc(null); setError(''); }}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-all text-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
                            >
                                <CheckCircle2 size={16} /> Save &amp; Continue
                            </button>
                        </div>

                        {error && <p className="text-red-500 text-xs text-center pb-4 px-6">{error}</p>}
                    </div>
                )}

                {step === 'saving' && (
                    <div className="bg-white border border-slate-200 rounded-md shadow-lg p-12 text-center">
                        <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-slate-800 font-bold text-lg">Saving your photo…</p>
                        <p className="text-slate-500 text-sm mt-2">Just a moment</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePictureGate;
