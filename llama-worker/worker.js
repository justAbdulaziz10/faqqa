// Minimal authenticated proxy: Faqqa backend -> Cloudflare Workers AI (Meta Llama).
const ALLOWED = new Set([
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
]);

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (request.headers.get("authorization") !== `Bearer ${env.PROXY_SECRET}`) {
      return json({ error: "unauthorized" }, 401);
    }
    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
    const model = body.model || "@cf/meta/llama-4-scout-17b-16e-instruct";
    if (!ALLOWED.has(model)) return json({ error: "model_not_allowed" }, 400);
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: "messages_required" }, 400);
    }
    try {
      const out = await env.AI.run(model, {
        messages: body.messages,
        max_tokens: Math.min(body.max_tokens ?? 1500, 2500),
        temperature: body.temperature ?? 0.4,
        ...(body.response_format ? { response_format: body.response_format } : {}),
      });
      return json({ model, response: out.response ?? out, usage: out.usage ?? null });
    } catch (err) {
      return json({ error: "llama_failed", detail: String(err?.message || err) }, 502);
    }
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
