import { CommunityProvider } from "../context/CommunityContext.jsx";
import CommunityPage from "./CommunityPage.jsx";

export default function CommunityRoute() {
  return (
    <CommunityProvider>
      <CommunityPage />
    </CommunityProvider>
  );
}
