import React from 'react';
import { useCommunity } from '../context/CommunityContext';
import ServerList from '../components/community/ServerList';
import ChannelList from '../components/community/ChannelList';
import ChatArea from '../components/community/ChatArea';
import MemberSidebar from '../components/community/MemberSidebar';

const CommunityPage = () => {
    const { loading, error } = useCommunity();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 relative z-[9999]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading community...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 relative z-[9999]">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4 mx-auto w-fit">⚠️</div>
                    <p className="text-slate-800 font-bold mb-2">Something went wrong</p>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-screen h-screen bg-slate-50 overflow-hidden fixed inset-0">
            {/* 1. Server List (Leftmost) - Fixed Width */}
            <ServerList />

            {/* 2. Channel List (Left-Mid) - Resizable or fixed */}
            <div className="flex flex-col border-r border-slate-200 bg-slate-50 w-60 shrink-0 h-full">
                <ChannelList />
            </div>

            {/* 3. Main Chat Area (Center) - Flexible width */}
            <div className="flex flex-1 flex-col min-w-0 bg-white h-full relative z-0">
                <ChatArea />
            </div>

            {/* 4. Member Sidebar (Right) - Fixed width, hidden on small screens */}
            <div className="hidden lg:flex w-60 border-l border-slate-200 bg-slate-50 shrink-0 h-full flex-col">
                <MemberSidebar />
            </div>
        </div>
    );
};

export default CommunityPage;
