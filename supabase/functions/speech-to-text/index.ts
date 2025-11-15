import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const speechSchema = z.object({
  audio: z.string().min(1, "Audio data is required").max(10485760, "Audio data too large (max 10MB base64)")
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting: 5 requests per minute per IP (transcription is resource-intensive)
  const clientId = getClientIdentifier(req);
  if (!checkRateLimit(clientId, 5, 60000)) {
    console.log(`Rate limit exceeded for client: ${clientId}`);
    return createRateLimitResponse(corsHeaders, 60);
  }

  try {
    const requestBody = await req.json();
    const validated = speechSchema.parse(requestBody);
    const { audio } = validated;
    
    console.log(`[SpeechToText]: Request from ${clientId} - audio size: ${audio.length} bytes`);
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY is not configured');
    }

    console.log('[SpeechToText]: Processing audio transcription with Eleven Labs...');

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model_id', 'scribe_v1');

    // Send to Eleven Labs Speech-to-Text API
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SpeechToText]: Eleven Labs API error:', errorText);
      throw new Error(`Eleven Labs API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('[SpeechToText]: Transcription complete');

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`[SpeechToText]: Error from ${clientId}:`, error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.errors }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
