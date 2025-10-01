import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

serve(async (req) => {
  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secretKey = 'whsec_' + Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

    return new Response(JSON.stringify({ secretKey }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});