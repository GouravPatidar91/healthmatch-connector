
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, userData?: { name: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only show success message for actual sign-in events, not session restoration
        if (event === 'SIGNED_IN' && !isInitialLoad) {
          toast({
            title: "Signed in successfully",
            description: "Welcome to Curezy!"
          });
          
          // Check if we're coming from Google OAuth redirect
          const currentPath = window.location.pathname;
          const isOAuthRedirect = window.location.search.includes('access_token') || 
                                 window.location.search.includes('refresh_token');
          
          if (isOAuthRedirect || currentPath === '/login' || currentPath === '/') {
            // Navigate to dashboard with a delay to ensure state is properly updated
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 300);
          }
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully."
          });
          // Navigate to homepage after sign out
          navigate('/', { replace: true });
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        // Mark that initial load is complete
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If user is already authenticated and on login page, redirect to dashboard
      if (session?.user && (window.location.pathname === '/login' || window.location.pathname === '/')) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast, navigate]);

  const signUp = async (email: string, password: string, userData?: { name: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      return { error };
    } catch (error) {
      console.error('SignUp error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      console.error('SignIn error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Use the current origin for the redirect, but ensure it goes to the right place
      const redirectTo = `${window.location.origin}/dashboard`;
      console.log('Google OAuth redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: "Google sign-in failed",
          description: error.message || "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Google SignIn error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('SignOut error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
