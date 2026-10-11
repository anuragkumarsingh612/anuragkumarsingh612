import { createClient } from "@supabase/supabase-js";
import type { Confirmation } from "./schemas";
import type { DemoState, Product, Purchase } from "../app/demo";
import { today } from "./format";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
let householdId: string | null = null;
let connection: Promise<DemoState | null> | null = null;
/** An anonymous Supabase identity keeps household rows protected by RLS. */
export function connectHousehold(): Promise<DemoState | null> {
  if (!supabase) return Promise.resolve(null);
  if (connection) return connection;
  connection = loadHousehold().catch((error) => {
    connection = null;
    throw error;
  });
  return connection;
}
async function loadHousehold(): Promise<DemoState> {
  const client = supabase!;
  const {
    data: { session },
  } = await client.auth.getSession();
  if (!session) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }
  const { data: id, error: createError } = await client.rpc("ensure_household");
  if (createError) throw createError;
  householdId = id;
  const [house, products, purchases] = await Promise.all([
    client.from("households").select("*").eq("id", id).single(),
    client.from("products").select("*").eq("household_id", id),
    client
      .from("purchases")
      .select("*,products(name)")
      .eq("household_id", id)
      .order("purchased_on", { ascending: false }),
  ]);
  for (const result of [house, products, purchases])
    if (result.error) throw result.error;
  return {
    version: 1,
    household: { name: house.data.name, city: house.data.city },
    products: (products.data ?? []).map(
      (p) =>
        ({
          id: p.id,
          name: p.name,
          pack: p.pack,
          category: p.category,
          art: p.art,
          gap: p.cycle_days ?? 30,
          overrideGap: p.manual_cycle_days,
          confidence: p.confidence,
          last: p.last_purchased_on ?? today(),
          store: p.store,
          price: p.price,
          ignored: p.ignored,
          snoozeUntil: p.snooze_until,
          skips: 0,
          learning: p.cycle_days == null,
        }) as Product,
    ),
    purchases: (purchases.data ?? []).map(
      (p) =>
        ({
          id: p.id,
          productId: p.product_id,
          name: p.products.name,
          store: p.store,
          date: p.purchased_on,
          quantity: p.quantity,
          price: p.price,
          source: "manual",
        }) as Purchase,
    ),
    list: [],
    savedOnce: (purchases.data?.length ?? 0) > 0,
  };
}
export async function savePurchase(data: Confirmation) {
  if (!supabase) return null;
  await connectHousehold();
  const { data: result, error } = await supabase.rpc("confirm_purchase", {
    p_household: householdId,
    p_store: data.store,
    p_date: data.date,
    p_items: data.items,
  });
  if (error) throw new Error("Could not save your purchase. Please try again.");
  return result as Array<{ id: string; name: string }>;
}
export async function updateProduct(
  id: string,
  patch: Record<string, unknown>,
) {
  if (!supabase) return;
  await connectHousehold();
  const { error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .eq("household_id", householdId);
  if (error)
    throw new Error("Could not update this reminder. Please try again.");
}
export async function parseReceipt(blob: Blob, type: string) {
  if (!supabase)
    throw new Error(
      "Photo reading needs a connected Supabase project. You can try the example receipt or enter your items below.",
    );
  await connectHousehold();
  const body = new FormData();
  body.append("image", blob, "receipt.jpg");
  body.append("type", type);
  const { data, error } = await supabase.functions.invoke("parse-receipt", {
    body,
  });
  if (error)
    throw new Error(
      "We couldn’t read that photo. Please try a clearer image or enter items manually.",
    );
  return data as { store: string | null; items: Confirmation["items"] };
}

export async function saveHousehold(household: { name: string; city: string }) {
  if (!supabase) return;
  await connectHousehold();
  const { error } = await supabase
    .from("households")
    .update(household)
    .eq("id", householdId);
  if (error)
    throw new Error("Could not save household details. Please try again.");
}
