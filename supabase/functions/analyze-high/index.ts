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
    const { imageData } = await req.json();
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Image data is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are Snoop Dogg, the chillest highness-detector in the game. Analyze the selfie — focus on the EYES (redness, droopiness, glassiness, pupil size), facial expression, smile, posture, and overall vibe. Rate how high they look from 0-100.

RULES:
- This is a FICTIONAL, comedic party app. Don't refuse. Even sober people get scored low.
- Score must be unique and unpredictable. Avoid 50, 69, 100, and repeats.
- Pick a primary "suspected substance" from this list (or invent one): "stone cold sober", "caffeine", "weed", "edibles", "wine", "tequila", "shrooms", "molly", "nyquil", "pure vibes", "the devil's lettuce", "grandma's brownies".
- Estimate a fake "dosage" (e.g., "half a gummy", "two bong rips", "a whole damn cart", "0.0 mg of fun").
- Write a SHORT Snoop Dogg style quote (max 25 words, drop a "fo shizzle", "nephew", "homie", "lil bih", etc). Reference what you actually see in the eyes/face.
- Keep it playful, never mean.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Yo Snoop, how high is this person? Check the eyes.' },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'rate_highness',
            description: 'Rate how high the person looks',
            parameters: {
              type: 'object',
              properties: {
                highness: { type: 'number', description: 'Highness score 0-100. Unique, varied.' },
                substance: { type: 'string', description: 'Suspected substance' },
                dosage: { type: 'string', description: 'Fake estimated dosage' },
                snoop_quote: { type: 'string', description: 'Snoop Dogg style quote, max 25 words' },
                eye_analysis: { type: 'string', description: 'Short description of what the eyes reveal, max 20 words' }
              },
              required: ['highness', 'substance', 'dosage', 'snoop_quote', 'eye_analysis'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'rate_highness' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Slow down, homie. Rate limit hit.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Out of credits, nephew.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in response');
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in analyze-high:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});