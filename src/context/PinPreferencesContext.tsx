import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createSupabaseWithHeaders } from '@/integrations/supabase/client';
import { usePin } from '@/hooks/usePin';

export type ListType = 'shopping' | 'todo';

type PinPreferencesContextType = {
  listType: ListType;
  updateListType: (newType: ListType) => Promise<void>;
  isProtected: boolean;
  setIsProtected: (isProtected: boolean) => Promise<void>;
  isLoading: boolean;
};

const PinPreferencesContext = createContext<PinPreferencesContextType | undefined>(undefined);

export const PinPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { pin } = usePin();
  const [listType, setListType] = useState<ListType>('shopping');
  const [isProtected, setIsProtectedState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pin) return;
    
    const fetchPreferences = async () => {
      const supabaseWithPin = createSupabaseWithHeaders({ "x-list-id": pin });
      const { data, error } = await supabaseWithPin
        .from('pin_preferences')
        .select('list_type, is_protected')
        .eq('pin', pin)
        .maybeSingle();

      if (data) {
        setListType(data.list_type as ListType);
        setIsProtectedState(data.is_protected || false);
      }
    };

    fetchPreferences();
  }, [pin]);

  const updateListType = async (newType: ListType) => {
    if (!pin) return;
    
    setIsLoading(true);
    const supabaseWithPin = createSupabaseWithHeaders({ "x-list-id": pin });
    
    const { error } = await supabaseWithPin
      .from('pin_preferences')
      .upsert(
        { pin, list_type: newType },
        { onConflict: 'pin' }
      );

    if (!error) {
      setListType(newType);
    }
    setIsLoading(false);
  };

  const setIsProtected = async (isProtected: boolean) => {
    if (!pin) return;
    
    setIsProtectedState(isProtected);
    const supabaseWithPin = createSupabaseWithHeaders({ "x-list-id": pin });
    
    await supabaseWithPin
      .from('pin_preferences')
      .upsert(
        { pin, is_protected: isProtected },
        { onConflict: 'pin' }
      );
  };

  return (
    <PinPreferencesContext.Provider value={{ listType, updateListType, isProtected, setIsProtected, isLoading }}>
      {children}
    </PinPreferencesContext.Provider>
  );
};

export const usePinPreferences = () => {
  const context = useContext(PinPreferencesContext);
  if (context === undefined) {
    throw new Error('usePinPreferences must be used within a PinPreferencesProvider');
  }
  return context;
};
