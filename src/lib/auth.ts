import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type JurusanType = "akuntansi" | "manajemen" | "perbankan_syariah";

export interface SignUpData {
  email: string;
  password: string;
  nama: string;
  nim: string;
  jurusan: JurusanType;
}

export interface Profile {
  id: string;
  nama: string;
  nim: string;
  email: string;
  jurusan: JurusanType;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function signUp({ email, password, nama, nim, jurusan }: SignUpData) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        nama,
        nim,
        jurusan,
      },
    },
  });

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile;
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();

  if (error) return false;
  return !!data;
}

export async function getCurrentSession(): Promise<{ user: User | null; session: Session | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  return { user: session?.user ?? null, session };
}