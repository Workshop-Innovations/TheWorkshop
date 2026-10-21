import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunity } from "../context/CommunityContext.jsx";
import ChannelList from "../components/community/ChannelList.jsx";
import ChatArea from "../components/community/ChatArea.jsx";
import MemberSidebar from "../components/community/MemberSidebar.jsx";
import GlobalLoader from "../components/feedback/GlobalLoader.jsx";
import { WifiOff } from "lucide-react";

const CommunityPage = () => {
  const { loading, error, isConnected, currentChannel, currentDM } =
    useCommunity();
  const [panel, setPanel] = useState("chat");
  useEffect(() => {
    setPanel("chat");
  }, [currentChannel?.id, currentDM?.id]);
  const navigate = useNavigate();

  if (loading) {
    return <GlobalLoader message="Loading The Workshop..." />;
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 fixed inset-0 z-[9999]">
        <div className="bg-white p-8 rounded-md shadow-xl border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <WifiOff size={28} className="text-red-400" />
          </div>
          <p className="text-slate-800 font-bold text-xl mb-3">
            Connection Lost
          </p>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mb-4 underline text-primary"
          >
            Retry connection
          </button>
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
    <div className="flex flex-col md:flex-row w-screen h-dvh bg-slate-50 overflow-hidden fixed inset-0 font-sans text-slate-800">
      <nav
        aria-label="Collaboration panels"
        className="md:hidden flex shrink-0 bg-white border-b p-2 gap-2"
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="px-2 py-3 text-primary"
        >
          Home
        </button>
        {["channels", "chat", "members"].map((name) => (
          <button
            key={name}
            aria-pressed={panel === name}
            onClick={() => setPanel(name)}
            className={`flex-1 capitalize rounded-md py-3 text-sm font-semibold ${panel === name ? "bg-primary text-white" : "bg-slate-100"}`}
          >
            {name}
          </button>
        ))}
      </nav>

      <div
        className={`${panel === "channels" ? "flex" : "hidden"} md:flex flex-col bg-white w-full md:w-60 lg:w-72 min-h-0 flex-1 md:flex-none border-r border-slate-200 relative`}
      >
        <ChannelList />
      </div>

      <div
        className={`${panel === "chat" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 min-h-0 bg-slate-50 relative`}
      >
        <ChatArea />
      </div>

      <div
        className={`${panel === "members" ? "flex" : "hidden"} md:flex flex-col bg-white w-full md:w-48 lg:w-56 min-h-0 flex-1 md:flex-none relative`}
      >
        <MemberSidebar />
      </div>

      {!isConnected && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-28 right-4 max-w-[calc(100%-2rem)] bg-rose-500 text-white text-sm font-bold px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3 border border-rose-600"
        >
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
          Reconnecting live updates…
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
