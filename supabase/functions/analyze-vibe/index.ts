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
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing vibe with AI...');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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
            content: `You are a hilarious vibe checker. Analyze photos and give a UNIQUE vibe score from 0-100 with a funny, sarcastic analysis.

CRITICAL: Generate wildly different scores each time. DO NOT default to 69, 72, 78, or 100. Use random, unexpected numbers like 23, 47, 88, 12, 91, 34, etc. Base scores on what you actually see - lighting, expression, outfit, background, everything. No two photos should ever get similar scores.

Be playful, witty, and roast them a little. Keep analysis under 30 words.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Rate the vibe in this photo from 0-100 and give a short, funny analysis.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'rate_vibe',
              description: 'Rate the vibe of the photo',
              parameters: {
                type: 'object',
                properties: {
                  score: {
                    type: 'number',
                    description: 'Vibe score from 0 to 100 as a whole number. MUST be unique and unpredictable - avoid 69, 72, 78, 100. Use random numbers across the full spectrum based on actual image details: lighting quality, facial expression, outfit style, background elements, pose, energy level, etc. Every score should be different and justified by what you observe.'
                  },
                  analysis: {
                    type: 'string',
                    description: 'Short, funny analysis of the vibe (max 30 words)'
                  }
                },
                required: ['score', 'analysis'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'rate_vibe' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }
    
    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-vibe function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
