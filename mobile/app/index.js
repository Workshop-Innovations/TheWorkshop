import { Redirect } from 'expo-router';

export default function Index() {
    // Our AuthContext handles the actual redirection logic
    // This just serves as the initial mount point
    return <Redirect href="/(auth)/onboarding" />;
}
