// Supabase Edge Function: telegram-order-notify
// Required Supabase secrets: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!token || !chatId) {
      return jsonResponse({ error: "Telegram secrets are missing. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Supabase Secrets." }, 500);
    }

    const body = await req.json();
    const order = body?.order;
    if (!order || !Array.isArray(order.items)) {
      return jsonResponse({ error: "Invalid order payload" }, 400);
    }

    const lines = [
      "🛍️ CLOTHE ONE — Nouvelle commande",
      "Commande : #" + String(order.id ?? "nouvelle"),
      "Client : " + String(order.first_name ?? "") + " " + String(order.last_name ?? ""),
      "Téléphone : " + String(order.phone ?? ""),
      "Ville : " + String(order.city ?? ""),
      "Adresse : " + String(order.address ?? ""),
      "",
      "Articles :",
      ...order.items.map((item: any) =>
        "• " + String(item.name ?? "Produit") + " × " + String(item.qty ?? 1) +
        " — " + String(item.price ?? 0) + " DT"
      ),
      "",
      "Livraison : " + String(order.delivery_fee ?? 0) + " DT",
      "TOTAL : " + String(order.total ?? 0) + " DT",
      "Statut : " + String(order.status ?? "En attente"),
    ];

    const telegramResponse = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        disable_web_page_preview: true,
      }),
    });

    const telegramResult = await telegramResponse.json();
    if (!telegramResponse.ok || !telegramResult.ok) {
      // Return Telegram's safe diagnostic only; never expose the bot token.
      return jsonResponse({
        error: "Telegram API rejected the message",
        telegram_error_code: telegramResult.error_code ?? telegramResponse.status,
        telegram_description: telegramResult.description ?? "No error description returned",
      }, 502);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({
      error: "Unexpected notification error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});
