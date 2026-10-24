import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunity } from "../context/CommunityContext";
import ChannelList from "../components/community/ChannelList";
import ChatArea from "../components/community/ChatArea";
import MemberSidebar from "../components/community/MemberSidebar";
import GlobalLoader from "../components/GlobalLoader";
import { WifiOff, Menu, Users, X } from "lucide-react";

const CommunityPage = () => {
    const { loading, error, isConnected } = useCommunity();
    const navigate = useNavigate();
    const [showChannels, setShowChannels] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    if (loading) {
        return <GlobalLoader message="Loading The Workshop..." />;
    }

    // Bug 13 fix: proper icon instead of empty div
    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 fixed inset-0 z-[9999]">
                <div className="bg-white p-8 rounded-md shadow-xl border border-red-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <WifiOff size={28} className="text-red-400" />
                    </div>
                    <p className="text-slate-800 font-bold text-xl mb-3">Connection Lost</p>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="px-8 py-3 bg-primary text-white rounded-md font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-screen h-screen bg-slate-50 overflow-hidden fixed inset-0 font-sans text-slate-800">
            {/* Mobile toolbar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3 z-30">
                <button onClick={() => setShowChannels(v => !v)} aria-label="Toggle channels" className="p-2 rounded-md hover:bg-slate-100">
                    {showChannels ? <X size={20} /> : <Menu size={20} />}
                </button>
                <span className="font-bold text-sm text-slate-700">Community</span>
                <button onClick={() => setShowMembers(v => !v)} aria-label="Toggle members" className="p-2 rounded-md hover:bg-slate-100">
                    {showMembers ? <X size={20} /> : <Users size={20} />}
                </button>
            </div>

            {/* Mobile overlay backdrop */}
            {(showChannels || showMembers) && (
                <div className="md:hidden fixed inset-0 bg-black/20 z-15" onClick={() => { setShowChannels(false); setShowMembers(false); }} />
            )}

            {/* Left Sidebar, Channels & DMs */}
            <div className={`flex flex-col bg-white w-72 shrink-0 h-full border-r border-slate-200 shadow-sm z-20 relative
                max-md:fixed max-md:top-12 max-md:left-0 max-md:bottom-0 max-md:transition-transform max-md:duration-200
                ${showChannels ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}>
                <ChannelList />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col min-w-0 bg-slate-50 h-full relative z-0 max-md:pt-12">
                <ChatArea />
            </div>

            {/* Right Sidebar: Members */}
            <div className={`flex flex-col bg-white w-56 shrink-0 h-full z-20 relative
                max-md:fixed max-md:top-12 max-md:right-0 max-md:bottom-0 max-md:transition-transform max-md:duration-200
                ${showMembers ? 'max-md:translate-x-0' : 'max-md:translate-x-full'}`}>
                <MemberSidebar />
            </div>

            {/* Connection indicator */}
            {!isConnected && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-sm font-bold px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3 border border-rose-600">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    Reconnecting to server...
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
