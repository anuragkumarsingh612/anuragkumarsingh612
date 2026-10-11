import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create schema auth; create role anon; create role authenticated;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema public,auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;
alter default privileges in schema public grant all on tables to authenticated,anon;
insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');`);
await db.exec(
  await readFile(
    new URL("../supabase/migrations/202610110001_restock.sql", import.meta.url),
    "utf8",
  ),
);
async function asUser(id) {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function scalar(sql, args = []) {
  return Object.values((await db.query(sql, args)).rows[0])[0];
}
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
await asUser(alice);
const a = await scalar("select public.ensure_household()");
assert.equal(
  await scalar("select public.ensure_household()"),
  a,
  "Household creation is idempotent",
);
const items = JSON.stringify([
  { name: "Rice", quantity: 1, price: 100, confidence: 0.9 },
]);
for (const date of ["2026-01-01", "2026-01-11", "2026-01-21", "2026-03-12"])
  await db.query("select public.confirm_purchase($1,$2,$3,$4)", [
    a,
    "Shop",
    date,
    items,
  ]);
assert.equal(
  Number(await scalar("select median_days from public.item_cycles")),
  10,
);
assert.equal(
  await scalar("select due_on::text from public.item_cycles"),
  "2026-03-22",
);
assert.equal(Number(await scalar("select count(*) from public.products")), 1);
await db.query("select public.confirm_purchase($1,$2,$3,$4)", [
  a,
  "Shop",
  "2026-03-12",
  JSON.stringify([{ name: " RICE ", quantity: 2, price: 120 }]),
]);
assert.equal(
  Number(await scalar("select median_days from public.item_cycles")),
  10,
  "Duplicate day is excluded",
);
assert.equal(
  Number(await scalar("select count(*) from public.products")),
  1,
  "Case/whitespace matching",
);
const before = await scalar("select count(*) from public.purchases");
await assert.rejects(
  db.query("select public.confirm_purchase($1,$2,$3,$4)", [
    a,
    "Shop",
    "2026-03-13",
    JSON.stringify([
      { name: "Rice", quantity: 1, price: 100 },
      { name: "Oil", quantity: -1, price: 20 },
    ]),
  ]),
);
assert.equal(
  await scalar("select count(*) from public.purchases"),
  before,
  "Invalid row rolls back entire receipt",
);
await assert.rejects(
  db.query("select public.confirm_purchase($1,$2,$3,$4)", [
    a,
    "Shop",
    "2999-01-01",
    items,
  ]),
);
await assert.rejects(db.exec("delete from public.purchases"));
await asUser(bob);
const b = await scalar("select public.ensure_household()");
assert.notEqual(a, b);
assert.equal(
  Number(await scalar("select count(*) from public.products")),
  0,
  "Products isolated",
);
assert.equal(
  Number(await scalar("select count(*) from public.purchases")),
  0,
  "Purchases isolated",
);
assert.equal(
  Number(await scalar("select count(*) from public.item_cycles")),
  0,
  "Cycles isolated",
);
await assert.rejects(
  db.query("select public.confirm_purchase($1,$2,$3,$4)", [
    a,
    "Shop",
    "2026-01-01",
    items,
  ]),
);
await assert.rejects(
  db.query("insert into public.products(household_id,name) values($1,$2)", [
    a,
    "Stolen",
  ]),
);
for (let i = 0; i < 20; i++)
  assert.equal(await scalar("select public.consume_receipt_quota()"), true);
assert.equal(
  await scalar("select public.consume_receipt_quota()"),
  false,
  "Twenty-request hourly cap enforced",
);
await db.exec("reset role; set role anon;");
await assert.rejects(db.query("select public.ensure_household()"));
await assert.rejects(
  db.query("select public.confirm_purchase($1,$2,$3,$4)", [
    a,
    "Shop",
    "2026-01-01",
    items,
  ]),
);
await db.close();
console.log(
  "Database checks passed: migration, household isolation, auth, matching, median cycles, duplicate dates, future-date rejection, transaction rollback, protected writes.",
);
