import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 60,
};

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  pin: string,
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number }> {
  const bucketStart = new Date();
  bucketStart.setMinutes(bucketStart.getMinutes() - (bucketStart.getMinutes() % config.windowMinutes));

  // Try to get existing rate limit entry
  const { data: existing } = await supabase
    .from('pin_rate_limits')
    .select('*')
    .eq('pin', pin)
    .eq('ip', ip)
    .eq('bucket_start', bucketStart.toISOString())
    .single();

  if (existing) {
    if (existing.attempts >= config.maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    // Increment attempts
    await supabase
      .from('pin_rate_limits')
      .update({ attempts: existing.attempts + 1 })
      .eq('id', existing.id);

    return {
      allowed: true,
      remaining: config.maxAttempts - existing.attempts - 1,
    };
  }

  // Create new rate limit entry
  await supabase.from('pin_rate_limits').insert({
    pin,
    ip,
    bucket_start: bucketStart.toISOString(),
    attempts: 1,
  });

  return { allowed: true, remaining: config.maxAttempts - 1 };
}

// Clean up old rate limit entries (call periodically)
export async function cleanupOldRateLimits(
  supabase: ReturnType<typeof createClient>,
  olderThanHours: number = 24
): Promise<void> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - olderThanHours);

  await supabase
    .from('pin_rate_limits')
    .delete()
    .lt('bucket_start', cutoff.toISOString());
}
