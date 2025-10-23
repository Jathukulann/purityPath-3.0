import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Initialize CSRF token when user becomes authenticated
  useEffect(() => {
    if (user && !isLoading) {
      // Call the CSRF endpoint to ensure the token is available
      // This is a fire-and-forget request to bootstrap the CSRF token
      fetch("/api/auth/csrf", {
        credentials: "include",
      }).catch(() => {
        // Silently ignore errors - the token will be set by middleware on next request
      });
    }
  }, [user, isLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}