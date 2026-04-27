import { useUser, useClerk } from "@clerk/clerk-react";
import App from "./App.jsx";

// This wrapper calls Clerk hooks (requires ClerkProvider in tree)
// and passes the values as plain props to App.
// When offline, App is rendered directly without this wrapper.
export default function AppClerkHooks() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  return (
    <App
      offlineMode={false}
      clerkIsLoaded={isLoaded}
      clerkIsSignedIn={isSignedIn}
      clerkUser={user}
      signOut={signOut}
    />
  );
}
