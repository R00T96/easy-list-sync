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

    if (!pin || !quantumKeyBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current protection
    const { data, error } = await supabase
      .from('pin_preferences')
      .select('*')
      .eq('pin', pin)
      .single();

    if (error || !data || !data.is_protected) {
      return new Response(
        JSON.stringify({ success: true }), // Already unprotected
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify key ownership
    const keyBytes = base64ToBytes(quantumKeyBase64);
    const context = `PIN:${pin}`;
    const recomputed = await hashKeyArgon2id(
      keyBytes,
      new Uint8Array(data.quantum_key_salt),
      context
    );

    const isValid = constantTimeEqual(
      new Uint8Array(data.quantum_key_hash),
      recomputed
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid key. Only the key holder can remove protection.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove protection
    const { error: updateError } = await supabase
      .from('pin_preferences')
      .update({
        is_protected: false,
        quantum_key_hash: null,
        quantum_key_salt: null,
        protected_at: null,
        protected_by_device_id: null,
        protection_version: data.protection_version + 1,
      })
      .eq('pin', pin);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to remove protection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log removal
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';
    
    await supabase.from('pin_protection_audit').insert({
      pin,
      event: 'REMOVE',
      ip,
      user_agent: userAgent,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in remove-protection:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
