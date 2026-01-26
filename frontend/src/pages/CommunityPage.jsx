import React from 'react';
import { useCommunity } from '../context/CommunityContext';
import ServerList from '../components/community/ServerList';
import ChannelList from '../components/community/ChannelList';
import ChatArea from '../components/community/ChatArea';
import MemberSidebar from '../components/community/MemberSidebar';
import './CommunityPage.css';

const CommunityPage = () => {
    const { loading, error } = useCommunity();

    if (loading) {
        return (
            <div className="community-page">
                <div className="community-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading community...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="community-page">
                <div className="community-error">
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="community-page">
            <ServerList />
            <ChannelList />
            <ChatArea />
            <MemberSidebar />
        </div>
    );
};

export default CommunityPage;
