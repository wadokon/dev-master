// DEV_MASTER 進捗同期API
// GET  /  … 進捗JSONを返す（誰でも読み取り可）
// PUT  /  … 進捗JSONを保存（Authorization: Bearer <WRITE_TOKEN> が一致した場合のみ）
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Authorization,Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    if (req.method === "GET") {
      const data = await env.PROGRESS.get("state");
      return new Response(data ?? "{}", {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      const auth = req.headers.get("Authorization") ?? "";
      if (auth !== `Bearer ${env.WRITE_TOKEN}`) {
        return new Response("Unauthorized", { status: 401, headers: cors });
      }
      const body = await req.text();
      if (body.length > 100_000) {
        return new Response("Payload too large", { status: 413, headers: cors });
      }
      let parsed;
      try { parsed = JSON.parse(body); } catch {
        return new Response("Invalid JSON", { status: 400, headers: cors });
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return new Response("Invalid JSON", { status: 400, headers: cors });
      }
      await env.PROGRESS.put("state", body);
      return new Response("OK", { headers: cors });
    }

    return new Response("Method Not Allowed", { status: 405, headers: cors });
  },
};
