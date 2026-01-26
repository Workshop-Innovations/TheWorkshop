import React from 'react';
import ServerList from '../components/community/ServerList';
import ChannelList from '../components/community/ChannelList';
import ChatArea from '../components/community/ChatArea';
import MemberSidebar from '../components/community/MemberSidebar';
import './Community.css';

const Community = () => {
    return (
        <div className="community-layout">
            {/* Server List - Leftmost vertical bar */}
            <ServerList />

            {/* Channel List - Second column */}
            <ChannelList />

            {/* Chat Area - Flexible center */}
            <ChatArea />

            {/* Member Sidebar - Rightmost column */}
            <div className="member-sidebar-wrapper">
                <MemberSidebar />
            </div>
        </div>
    );
};

export default Community;

