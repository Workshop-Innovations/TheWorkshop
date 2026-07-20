import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../context/CommunityContext';
import ChannelList from '../components/community/ChannelList';
import ChatArea from '../components/community/ChatArea';
import MemberSidebar from '../components/community/MemberSidebar';

const CommunityPage = () => {
    const { loading, error, isConnected } = useCommunity();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#0F172A] fixed inset-0 z-[9999]">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🛠️</div>
                    </div>
                    <p className="text-indigo-200 font-medium tracking-wide">Loading The Workshop...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#0F172A] fixed inset-0 z-[9999]">
                <div className="bg-[#1E293B] p-8 rounded-3xl shadow-2xl border border-red-500/20 max-w-md w-full text-center">
                    <div className="text-5xl mb-6">⚠️</div>
                    <p className="text-white font-bold text-xl mb-3">Connection Lost</p>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-screen h-screen bg-[#0F172A] overflow-hidden fixed inset-0 font-sans text-slate-200">
            {/* Unified Sidebar (Channels & DMs) */}
            <div className="flex flex-col bg-[#1E293B] w-72 shrink-0 h-full border-r border-slate-700/50 shadow-2xl z-10 relative">
                <ChannelList />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col min-w-0 bg-[#0F172A] h-full relative z-0">
                <ChatArea />
            </div>

            {/* Member Sidebar */}
            <div className="hidden lg:flex w-72 bg-[#1E293B] shrink-0 h-full flex-col border-l border-slate-700/50 shadow-[-10px_0_20px_rgba(0,0,0,0.2)] z-10">
                <MemberSidebar />
            </div>

            {/* Connection indicator */}
            {!isConnected && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-rose-500/90 backdrop-blur-md text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 border border-rose-400/30">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    Reconnecting to server...
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
