import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { hashKeyArgon2id, constantTimeEqual, base64ToBytes } from '../_shared/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin, quantumKeyBase64 } = await req.json();

    if (!pin) {
      return new Response(
        JSON.stringify({ error: 'PIN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch protection info
    const { data, error } = await supabase
      .from('pin_preferences')
      .select('is_protected, quantum_key_hash, quantum_key_salt, protected_by_device_id')
      .eq('pin', pin)
      .single();

    if (error || !data) {
      // No preferences = unprotected = can edit
      return new Response(
        JSON.stringify({ canEdit: true, reason: 'unprotected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If not protected, anyone can edit
    if (!data.is_protected || !data.quantum_key_hash || !data.quantum_key_salt) {
      return new Response(
        JSON.stringify({ canEdit: true, reason: 'unprotected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If protected but no key provided, cannot edit
    if (!quantumKeyBase64) {
      return new Response(
        JSON.stringify({ 
          canEdit: false, 
          reason: 'protected',
          deviceId: data.protected_by_device_id ? data.protected_by_device_id.substring(0, 8) : null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the key
    const keyBytes = base64ToBytes(quantumKeyBase64);
    const context = `PIN:${pin}`;
    const recomputed = await hashKeyArgon2id(
      keyBytes,
      new Uint8Array(data.quantum_key_salt),
      context
    );

    const canEdit = constantTimeEqual(
      new Uint8Array(data.quantum_key_hash),
      recomputed
    );

    // Log verification attempt
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';
    
    await supabase.from('pin_protection_audit').insert({
      pin,
      event: canEdit ? 'VERIFY_SUCCESS' : 'VERIFY_FAIL',
      ip,
      user_agent: userAgent,
    });

    return new Response(
      JSON.stringify({ 
        canEdit,
        reason: canEdit ? 'key_valid' : 'key_invalid',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-pin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
