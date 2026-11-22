// Supabase Edge Function: telegram-order-notify
// Required Supabase secrets: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!token || !chatId) {
      return new Response(JSON.stringify({ error: "Telegram secrets are not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const order = body?.order;
    if (!order || !Array.isArray(order.items)) {
      return new Response(JSON.stringify({ error: "Invalid order payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Telegram API rejected the message" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Unexpected notification error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
