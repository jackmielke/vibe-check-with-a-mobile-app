import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, name } = await req.json();
    
    if (!imageData || !name) {
      return new Response(
        JSON.stringify({ error: 'imageData and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing vibe submission for: ${name}`);

    // Step 1: Analyze the vibe using Lovable AI
    console.log('Analyzing vibe with AI...');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }
    
    const { score, analysis } = JSON.parse(toolCall.function.arguments);
    console.log(`Vibe analyzed - Score: ${score}, Analysis: ${analysis}`);

    // Step 2: Upload image to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${Date.now()}-${name.replace(/\s+/g, '-')}.jpg`;

    console.log(`Uploading image to storage: ${fileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vibe-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vibe-photos')
      .getPublicUrl(fileName);

    console.log(`Image uploaded successfully: ${publicUrl}`);

    // Step 3: Insert into leaderboard
    const { data: leaderboardEntry, error: dbError } = await supabase
      .from('leaderboard')
      .insert({
        name: name,
        score: score,
        vibe_analysis: analysis,
        image_url: publicUrl
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw new Error(`Failed to save to leaderboard: ${dbError.message}`);
    }

    console.log(`Successfully created leaderboard entry with ID: ${leaderboardEntry.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: leaderboardEntry
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-vibe function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
