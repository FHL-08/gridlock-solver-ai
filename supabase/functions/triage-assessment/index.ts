import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, videoFilename, bleeding, conversationHistory = [] } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('[TriageAgent]: Analyzing patient data - Symptoms:', symptoms, 'Video:', videoFilename);

    // Build conversation context
    const messages = [
      {
        role: 'user',
        parts: [{
          text: `You are an expert medical triage AI agent. Your role is to:
1. Assess the severity of the patient's condition (scale 1-10)
2. Ask intelligent follow-up questions if needed to clarify symptoms
3. Generate comprehensive triage notes

Patient Information:
- Symptoms described: ${symptoms}
- Video assessment: ${videoFilename}
- Bleeding: ${bleeding}

${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}` : ''}

Based on this information, provide:
1. A severity score (1-10) where:
   - 1-3: Minor issues (sprains, minor cuts)
   - 4-6: Moderate issues (fractures, severe pain)
   - 7-9: Serious issues (deep lacerations, internal injuries suspected)
   - 10: Critical/Life-threatening (stroke, heart attack, severe trauma)

2. Detailed triage notes explaining your assessment

3. If you need more information, ask ONE specific question to clarify the situation

Respond in JSON format:
{
  "severity": number,
  "triageNotes": "detailed notes",
  "needsMoreInfo": boolean,
  "question": "your question if needsMoreInfo is true"
}`
        }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(`Gemini API error: ${JSON.stringify(data)}`);
    }

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    
    console.log('[TriageAgent]: Assessment complete - Severity:', result.severity);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in triage-assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
