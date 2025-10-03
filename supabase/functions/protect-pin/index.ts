import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import { hashKeyArgon2id, constantTimeEqual, randomBytes, base64ToBytes } from '../_shared/crypto.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin, quantumKeyBase64, deviceId } = await req.json();

    if (!pin || !quantumKeyBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || '';

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, pin, ip);
    if (!rateLimit.allowed) {
      await supabase.from('pin_protection_audit').insert({
        pin,
        event: 'CLAIM_ATTEMPT',
        device_id: deviceId || null,
        ip,
        user_agent: userAgent,
        details: { reason: 'rate_limited' },
      });

      return new Response(
        JSON.stringify({ error: 'Too many attempts. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode the key
    const keyBytes = base64ToBytes(quantumKeyBase64);
    const salt = randomBytes(16);
    const context = `PIN:${pin}`;

    // Hash the key
    const hash = await hashKeyArgon2id(keyBytes, salt, context);

    // Start transaction
    const { data: existing, error: fetchError } = await supabase
      .from('pin_preferences')
      .select('*')
      .eq('pin', pin)
      .single();

    // Check if already protected
    if (existing?.is_protected && existing?.quantum_key_hash) {
      await supabase.from('pin_protection_audit').insert({
        pin,
        event: 'CLAIM_ATTEMPT',
        device_id: deviceId || null,
        ip,
        user_agent: userAgent,
        details: { reason: 'already_protected' },
      });

      return new Response(
        JSON.stringify({ error: 'This PIN is already protected by another device' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or insert protection
    const { error: updateError } = await supabase
      .from('pin_preferences')
      .upsert({
        pin,
        is_protected: true,
        quantum_key_hash: hash,
        quantum_key_salt: salt,
        protected_at: new Date().toISOString(),
        protected_by_device_id: deviceId || null,
        protection_version: (existing?.protection_version || 0) + 1,
      });

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to protect PIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log success
    await supabase.from('pin_protection_audit').insert({
      pin,
      event: 'CLAIM_SUCCESS',
      device_id: deviceId || null,
      ip,
      user_agent: userAgent,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        protectedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in protect-pin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
