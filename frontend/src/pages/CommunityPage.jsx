import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../context/CommunityContext';
import ChannelList from '../components/community/ChannelList';
import ChatArea from '../components/community/ChatArea';
import MemberSidebar from '../components/community/MemberSidebar';
import GlobalLoader from '../components/GlobalLoader';

const CommunityPage = () => {
    const { loading, error, isConnected } = useCommunity();
    const navigate = useNavigate();

    if (loading) {
        return <GlobalLoader message="Loading The Workshop..." />;
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 fixed inset-0 z-[9999]">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center">
                    <div className="text-5xl mb-6">⚠️</div>
                    <p className="text-slate-800 font-bold text-xl mb-3">Connection Lost</p>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-screen h-screen bg-slate-50 overflow-hidden fixed inset-0 font-sans text-slate-800">
            {/* Unified Sidebar (Channels & DMs) */}
            <div className="flex flex-col bg-white w-72 shrink-0 h-full border-r border-slate-200 shadow-sm z-10 relative">
                <ChannelList />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col min-w-0 bg-slate-50 h-full relative z-0">
                <ChatArea />
            </div>

            {/* Member Sidebar */}
            <div className="hidden lg:flex w-72 bg-white shrink-0 h-full flex-col border-l border-slate-200 shadow-sm z-10">
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
