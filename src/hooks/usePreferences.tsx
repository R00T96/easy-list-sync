import { createContext, useContext, useState, useEffect } from 'react';
import { usePin } from '@/hooks/usePin';
import { createSupabaseWithHeaders } from '@/integrations/supabase/client';

const PreferencesContext = createContext({});

export const PreferencesProvider = ({ children }) => {
  const { pin } = usePin();
  const [preferences, setPreferences] = useState({
    hide_footer: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences when PIN changes
  useEffect(() => {
    const loadPreferences = async () => {
      if (!pin) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createSupabaseWithHeaders({ 'x-list-id': pin });
        const { data, error } = await supabase
          .from('pin_preferences')
          .select('*')
          .eq('pin', pin)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error);
        } else if (data) {
          setPreferences(data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [pin]);

  // Update a preference
  const updatePreference = async (key, value) => {
    if (!pin) return;

    try {
      const supabase = createSupabaseWithHeaders({ 'x-list-id': pin });
      const newPreferences = { ...preferences, [key]: value };
      
      // Check if preference record exists
      const { data: existing } = await supabase
        .from('pin_preferences')
        .select('id')
        .eq('pin', pin)
        .single();

      if (existing) {
        await supabase
          .from('pin_preferences')
          .update(newPreferences)
          .eq('pin', pin);
      } else {
        await supabase
          .from('pin_preferences')
          .insert({ pin, ...newPreferences });
      }

      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };

  const value = {
    preferences,
    updatePreference,
    isLoading
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};