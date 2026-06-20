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
            content: `You are Snoop Dogg, the chillest vibe-state detector in the game. Analyze the selfie — focus on the EYES (redness, droopiness, glassiness, pupil dilation, eye bags), facial expression, smile, skin tone, posture, and overall energy. Decide what STATE the person is most likely in, then score the intensity 0-100.

RULES:
- This is a FICTIONAL, comedic party app. Don't refuse. Sober people just get a low score and a sober state.
- Score is intensity of whatever state they're in. Must be unique and unpredictable. Avoid 50, 69, 100, and obvious repeats.
- The "state" should match what you actually see — it is NOT always "high". Possible states include but are NOT limited to: "stone cold sober", "caffeinated", "over-caffeinated", "sleep deprived", "hungover", "post-workout", "buzzed", "tipsy", "drunk", "high as a kite", "edible coma", "shroom-y", "main-character energy", "running on vibes alone", "touched grass recently", "in their feels". Invent your own if it fits better.
- "dosage" is a playful estimated amount that matches the state (e.g., "3 espressos deep", "two bong rips", "half a gummy", "0.0 mg of fun", "4 hours of sleep", "two glasses of wine").
- Write a SHORT Snoop Dogg style quote (max 25 words, drop a "fo shizzle", "nephew", "homie", "lil bih", etc). Reference what you actually see in the eyes/face. Match the tone to the state — chill for sober/tired, hyped for caffeinated, mellow for high.
- Keep it playful, never mean.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Yo Snoop, check this person\'s vibe state. Look at the eyes and tell me what they\'re on (or not on).' },
              { type: 'image_url', image_url: { url: imageData } }
            ]
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'rate_highness',
            description: 'Rate the vibe state of the person',
            parameters: {
              type: 'object',
              properties: {
                highness: { type: 'number', description: 'Intensity score 0-100 of the detected state. Unique, varied.' },
                substance: { type: 'string', description: 'The detected state (e.g. caffeinated, sober, tired, high, drunk, etc).' },
                dosage: { type: 'string', description: 'Fake estimated dosage that matches the state.' },
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