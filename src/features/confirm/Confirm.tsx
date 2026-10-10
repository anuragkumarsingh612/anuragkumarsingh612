import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Plus, Trash2, Info } from "lucide-react";
import { useDemo } from "../../app/context";
import { STORES, type Product, type Purchase } from "../../app/demo";
import { confirmationSchema, type Confirmation } from "../../lib/schemas";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { today, rupees } from "../../lib/format";
import { Button, PageHeading } from "../../components/ui";
import { InstallPrompt } from "../settings/InstallPrompt";
export default function Confirm() {
  const [params] = useSearchParams();
  const sample = params.get("sample") === "1";
  const { setState, notify } = useDemo();
  const navigate = useNavigate();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<Confirmation>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      store: sample ? "D-Mart" : STORES[0],
      date: today(),
      items: sample
        ? [
            {
              name: "Aashirvaad Shudh Chakki Atta",
              quantity: 1,
              price: 245,
              confidence: 0.96,
            },
            { name: "Tata Salt", quantity: 1, price: 28, confidence: 0.62 },
          ]
        : [{ name: "", quantity: 1, price: null, confidence: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  function save(data: Confirmation) {
    setState((s) => {
      const products = [...s.products];
      const purchases: Purchase[] = [];
      for (const row of data.items) {
        let product = products.find(
          (p) => p.name.toLocaleLowerCase() === row.name.toLocaleLowerCase(),
        );
        if (!product) {
          product = {
            id: crypto.randomUUID(),
            name: row.name,
            pack: "",
            category: "pantry",
            art: "lentils",
            gap: 30,
            confidence: 0,
            last: data.date,
            store: data.store,
            price: row.price,
            ignored: false,
            snoozeUntil: null,
            skips: 0,
            learning: true,
          } satisfies Product;
          products.push(product);
        } else if (data.date >= product.last) {
          products[products.indexOf(product)] = {
            ...product,
            last: data.date,
            store: data.store,
            price: row.price,
            snoozeUntil: null,
            skips: 0,
          };
        }
        purchases.push({
          id: crypto.randomUUID(),
          productId: product.id,
          name: row.name,
          store: data.store,
          date: data.date,
          quantity: row.quantity,
          price: row.price,
          source: sample ? "sample" : "manual",
        });
      }
      return {
        ...s,
        products,
        purchases: [...purchases, ...s.purchases],
        savedOnce: true,
      };
    });
    notify(c.confirm.saved);
  }
  if (isSubmitSuccessful)
    return (
      <div className="page success-page">
        <div className="success-icon">
          <Check size={34} />
        </div>
        <h1>{c.confirm.saved}</h1>
        <p>{c.common.demoNote}</p>
        <Button onClick={() => navigate("/history")}>{c.common.history}</Button>
        <InstallPrompt />
        <Button variant="ghost" onClick={() => navigate("/")}>
          {c.common.home}
        </Button>
      </div>
    );
  return (
    <div className="page">
      <PageHeading title={c.confirm.title} subtitle={c.confirm.subtitle} back />
      <div className="info-banner">
        <Info size={17} />
        {sample ? c.confirm.sampleNotice : c.confirm.manualNotice}
      </div>
      <form onSubmit={handleSubmit(save)}>
        <div className="form-grid">
          <label>
            {c.common.store}
            <select {...register("store")}>
              {STORES.map((store) => (
                <option key={store}>{store}</option>
              ))}
            </select>
            {errors.store && (
              <span className="field-error">{errors.store.message}</span>
            )}
          </label>
          <label>
            {c.common.date}
            <input type="date" max={today()} {...register("date")} />
            {errors.date && (
              <span className="field-error">{errors.date.message}</span>
            )}
          </label>
        </div>
        <div className="confirm-rows">
          {fields.map((field, i) => (
            <fieldset className="card confirm-row" key={field.id}>
              <legend className="sr-only">
                {f(c.confirm.itemNumber, { number: i + 1 })}
              </legend>
              <div className="row-top">
                <span className="eyebrow">
                  {f(c.confirm.itemNumber, { number: i + 1 })}
                </span>
                {field.confidence < 0.7 && (
                  <span className="check-tag">{c.confirm.check}</span>
                )}
                <button
                  type="button"
                  className="icon-button"
                  aria-label={f(c.confirm.removeItem, { number: i + 1 })}
                  onClick={() => remove(i)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <label>
                {c.common.name}
                <input
                  {...register(`items.${i}.name`)}
                  aria-invalid={!!errors.items?.[i]?.name}
                />
                {errors.items?.[i]?.name && (
                  <span className="field-error">
                    {errors.items[i]?.name?.message}
                  </span>
                )}
              </label>
              <div className="form-grid">
                <label>
                  {c.common.quantity}
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    {...register(`items.${i}.quantity`)}
                    aria-invalid={!!errors.items?.[i]?.quantity}
                  />
                  {errors.items?.[i]?.quantity && (
                    <span className="field-error">
                      {c.confirm.errorQuantity}
                    </span>
                  )}
                </label>
                <label>
                  {c.common.price}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={c.common.optional}
                    {...register(`items.${i}.price`)}
                    aria-invalid={!!errors.items?.[i]?.price}
                  />
                  {errors.items?.[i]?.price && (
                    <span className="field-error">{c.confirm.errorPrice}</span>
                  )}
                </label>
              </div>
            </fieldset>
          ))}
        </div>
        {errors.items?.message && (
          <p className="field-error" role="alert">
            {errors.items.message}
          </p>
        )}
        <Button
          variant="secondary"
          type="button"
          className="full-width dashed-button"
          disabled={fields.length >= 100}
          onClick={() =>
            append({ name: "", quantity: 1, price: null, confidence: 1 })
          }
        >
          <Plus size={18} />
          {c.confirm.addRow}
        </Button>
        <div className="confirm-total">
          <span>{c.confirm.total}</span>
          <strong>
            {rupees(
              items.reduce((sum, row) => sum + (Number(row.price) || 0), 0),
            )}
          </strong>
        </div>
        <Button
          className="full-width"
          type="submit"
          disabled={isSubmitting || !fields.length}
        >
          <Check size={18} />
          {f(c.confirm.save, { count: fields.length })}
        </Button>
      </form>
    </div>
  );
}
