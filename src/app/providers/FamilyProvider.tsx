import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';
import type { Family } from '@/entities/family/model/types';
import type { Member } from '@/entities/member/model/types';

interface FamilyContextType {
  user: User | null;
  family: Family | null;
  member: Member | null;
  loading: boolean;
  error: Error | null;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 1. Initial Auth Check
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchFamilyData(currentUser.id);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        await fetchFamilyData(currentUser.id);
        setLoading(false);
      } else {
        setFamily(null);
        setMember(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFamilyData = async (userId: string) => {
    try {
      // Fetch member data (which includes family_id)
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();

      if (memberError) throw memberError;
      setMember(memberData as Member);

      // Fetch family data
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', memberData.family_id)
        .single();

      if (familyError) throw familyError;
      setFamily(familyData as Family);
    } catch (err) {
      console.error('Error fetching family data:', err);
      setError(err as Error);
    }
  };

  return (
    <FamilyContext.Provider value={{ user, family, member, loading, error }}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
