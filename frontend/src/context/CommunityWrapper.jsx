import { CommunityProvider } from './CommunityContext';

const CommunityWrapper = ({ children }) => (
  <CommunityProvider>{children}</CommunityProvider>
);

export default CommunityWrapper;
