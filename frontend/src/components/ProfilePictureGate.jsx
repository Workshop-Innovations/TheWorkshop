import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { getCroppedImg } from '../utils/imageUtils';
import { Camera, ArrowRight, Users2, ImagePlus, CheckCircle2 } from 'lucide-react';

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
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {step === 'prompt' && (
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                            <Users2 size={36} className="text-primary" />
                        </div>

                        <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                            One last step
                        </h1>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Before you join the community, add a profile picture so other members know who they're talking to.
                        </p>

                        {/* Upload trigger */}
                        <label className="block cursor-pointer">
                            <div className="flex items-center justify-center gap-3 w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/30">
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

                        {error && <p className="text-rose-400 text-xs mt-4">{error}</p>}

                        <p className="text-slate-600 text-xs mt-6">
                            Hello, <span className="text-slate-400 font-semibold">{user?.username || user?.email?.split('@')[0]}</span> 👋 — your pic will be visible to all community members.
                        </p>
                    </div>
                )}

                {step === 'crop' && imageSrc && (
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden">
                        {/* Cropper */}
                        <div className="relative w-full" style={{ height: 320 }}>
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
                        <div className="px-6 py-3 bg-black/30">
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={e => setZoom(Number(e.target.value))}
                                className="w-full accent-primary"
                            />
                            <p className="text-slate-400 text-xs text-center mt-1">Drag to position · Scroll to zoom</p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={() => { setStep('prompt'); setImageSrc(null); setError(''); }}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-sm"
                            >
                                <CheckCircle2 size={16} /> Save &amp; Continue
                            </button>
                        </div>

                        {error && <p className="text-rose-400 text-xs text-center pb-4 px-6">{error}</p>}
                    </div>
                )}

                {step === 'saving' && (
                    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-white font-bold text-lg">Saving your photo…</p>
                        <p className="text-slate-400 text-sm mt-2">Just a moment</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePictureGate;
