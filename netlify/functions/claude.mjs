// Netlify Function: proxy verso Groq API
// La chiave sta in GROQ_API_KEY delle env vars Netlify
// Free tier: 14400 richieste/giorno, 30 richieste/minuto

export default async (req, context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Netlify.env.get("GROQ_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: { message: "Server non configurato: manca GROQ_API_KEY su Netlify" }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
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

    // Modello Groq: Llama 3.3 70B Versatile (gratis, ottima qualità)
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

    // Estraggo il testo dalla risposta Groq (formato OpenAI-compatible)
    // e normalizzo in { content: [{ type: "text", text }] }
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
};

export const config = {
  path: "/api/claude",
};
