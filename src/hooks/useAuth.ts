import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { isAdmin, getProfile, type Profile } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout
        if (session?.user) {
          setTimeout(async () => {
            const [profileData, adminStatus] = await Promise.all([
              getProfile(session.user.id),
              isAdmin(session.user.id),
            ]);
            setProfile(profileData);
            setIsAdminUser(adminStatus);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdminUser(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        Promise.all([
          getProfile(session.user.id),
          isAdmin(session.user.id),
        ]).then(([profileData, adminStatus]) => {
          setProfile(profileData);
          setIsAdminUser(adminStatus);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, session, profile, isAdmin: isAdminUser, loading };
}