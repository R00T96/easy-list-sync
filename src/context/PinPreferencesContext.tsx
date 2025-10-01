import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createSupabaseWithHeaders } from '@/integrations/supabase/client';
import { usePin } from '@/hooks/usePin';

export type ListType = 'shopping' | 'todo';

type PinPreferencesContextType = {
  listType: ListType;
  updateListType: (newType: ListType) => Promise<void>;
  isLoading: boolean;
};

const PinPreferencesContext = createContext<PinPreferencesContextType | undefined>(undefined);

export const PinPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { pin } = usePin();
  const [listType, setListType] = useState<ListType>('shopping');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pin) return;
    
    const fetchPreferences = async () => {
      const supabaseWithPin = createSupabaseWithHeaders({ "x-list-id": pin });
      const { data, error } = await supabaseWithPin
        .from('pin_preferences')
        .select('list_type')
        .eq('pin', pin)
        .maybeSingle();

      if (data) {
        setListType(data.list_type as ListType);
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

  return (
    <PinPreferencesContext.Provider value={{ listType, updateListType, isLoading }}>
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
