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
            <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-slate-500 font-medium">Loading community...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4 mx-auto w-fit">⚠️</div>
                    <p className="text-slate-800 font-bold mb-2">Something went wrong</p>
                    <p className="text-slate-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen mt-0 bg-slate-50 overflow-hidden">
            <ServerList />
            <div className="flex flex-1 overflow-hidden">
                <ChannelList />
                <ChatArea />
                <MemberSidebar />
            </div>
        </div>
    );
};

export default CommunityPage;
