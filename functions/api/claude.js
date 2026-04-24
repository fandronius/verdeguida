// Cloudflare Pages Function: proxy verso Groq API
// Percorso file: functions/api/claude.js
// Sarà raggiungibile a /api/claude

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: { message: "Server non configurato: manca GROQ_API_KEY su Cloudflare" }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const prompt = body.prompt;
    const maxTokens = body.maxTokens || 1000;

    if (!prompt) {
      return new Response(JSON.stringify({
        error: { message: "Manca il campo 'prompt'" }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "llama-3.3-70b-versatile";

    const groqBody = {
      model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqBody),
    });

    const textResponse = await groqRes.text();

    if (!groqRes.ok) {
      console.error("Groq API error:", groqRes.status, textResponse);
      return new Response(textResponse, {
        status: groqRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(textResponse);
    const text = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      content: [{ type: "text", text }]
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(JSON.stringify({
      error: { message: `Errore proxy: ${err.message}` }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
