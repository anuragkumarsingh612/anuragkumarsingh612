import { handleReceipt } from "./index.ts";
function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
Deno.test(
  "vision API: auth, CORS, image validation, extraction, malformed AI and quota boundaries",
  async () => {
    const originalFetch = globalThis.fetch;
    const names = [
      "APP_ORIGIN",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "OPENAI_API_KEY",
    ];
    const previous = names.map((name) => Deno.env.get(name));
    Deno.env.set("APP_ORIGIN", "http://localhost:5173");
    Deno.env.set("SUPABASE_URL", "http://supabase.test");
    Deno.env.set("SUPABASE_ANON_KEY", "synthetic-test-key");
    Deno.env.set("OPENAI_API_KEY", "synthetic-test-key");
    let aiCalled = false;
    let malformed = false;
    let quota = true;
    let providerStatus = 200;
    globalThis.fetch = async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.endsWith("/auth/v1/user"))
        return Response.json({
          id: "11111111-1111-4111-8111-111111111111",
          aud: "authenticated",
        });
      if (url.endsWith("/rest/v1/rpc/consume_receipt_quota"))
        return Response.json(quota);
      assert(
        url === "https://api.openai.com/v1/chat/completions",
        "Unexpected outbound URL",
      );
      aiCalled = true;
      const body = JSON.parse(String(init?.body));
      assert(body.model === "gpt-4o");
      assert(
        body.messages[1].content[1].image_url.url.startsWith(
          "data:image/jpeg;base64,",
        ),
      );
      if (providerStatus !== 200)
        return Response.json({ error: "busy" }, { status: providerStatus });
      return Response.json({
        choices: [
          {
            message: {
              content: malformed
                ? "not-json"
                : JSON.stringify({
                    store: "Shop",
                    items: [
                      {
                        name: "Rice",
                        quantity: 1,
                        price: 120,
                        confidence: 0.96,
                      },
                    ],
                  }),
            },
          },
        ],
      });
    };
    const headers = {
      origin: "http://localhost:5173",
      authorization: "Bearer synthetic-test-token",
    };
    const imageRequest = (
      file = new File(
        [new Uint8Array([255, 216, 255, 224, 0])],
        "receipt.jpg",
        { type: "image/jpeg" },
      ),
    ) => {
      const form = new FormData();
      form.append("image", file);
      form.append("type", "bill");
      return new Request("http://localhost/parse-receipt", {
        method: "POST",
        headers,
        body: form,
      });
    };
    try {
      assert(
        (
          await handleReceipt(
            new Request("http://localhost/", { method: "POST" }),
          )
        ).status === 401,
      );
      assert(
        (
          await handleReceipt(
            new Request("http://localhost/", {
              headers: { origin: "https://wrong.test" },
            }),
          )
        ).status === 403,
      );
      assert(
        (
          await handleReceipt(
            new Request("http://localhost/", { method: "OPTIONS", headers }),
          )
        ).status === 204,
      );
      assert(
        (await handleReceipt(new Request("http://localhost/", { headers })))
          .status === 405,
      );
      assert(
        (
          await handleReceipt(
            imageRequest(
              new File(["not-image"], "bad.jpg", { type: "image/jpeg" }),
            ),
          )
        ).status === 400,
      );
      assert(!aiCalled, "Invalid images must never reach OpenAI");
      const success = await handleReceipt(imageRequest());
      assert(success.status === 200);
      assert((await success.json()).items[0].name === "Rice");
      malformed = true;
      assert((await handleReceipt(imageRequest())).status === 422);
      malformed = false;
      quota = false;
      aiCalled = false;
      assert((await handleReceipt(imageRequest())).status === 429);
      assert(!aiCalled);
      quota = true;
      providerStatus = 429;
      assert((await handleReceipt(imageRequest())).status === 429);
      const oversized = new Request("http://localhost/", {
        method: "POST",
        headers,
        body: new Uint8Array(5 * 1024 * 1024 + 65537),
      });
      assert((await handleReceipt(oversized)).status === 413);
    } finally {
      globalThis.fetch = originalFetch;
      names.forEach((name, i) =>
        previous[i] === undefined
          ? Deno.env.delete(name)
          : Deno.env.set(name, previous[i]!),
      );
    }
  },
);
