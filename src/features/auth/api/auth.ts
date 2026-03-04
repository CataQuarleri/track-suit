import { supabase } from '@/shared/api/supabase';

export const signIn = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  return { error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * For a first-time user in this demo/MVP, we'll auto-create a family.
 * In a real app, this would be a multi-step onboarding.
 */
export const initializeNewUser = async (userId: string, userName: string, familyName: string) => {
  // 1. Create the family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert([{ name: familyName }])
    .select()
    .single();

  if (familyError) throw familyError;

  // 2. Create the member link
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert([{ 
      id: userId, 
      family_id: family.id, 
      name: userName 
    }])
    .select()
    .single();

  if (memberError) throw memberError;

  return { family, member };
};
