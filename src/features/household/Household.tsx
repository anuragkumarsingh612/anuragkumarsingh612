import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Check,
  Users,
  ArrowUpRight,
  Trash2,
  MapPin,
  Pencil,
} from "lucide-react";
import { useDemo } from "../../app/context";
import { copy as c, interpolate as f } from "../../lib/i18n";
import { householdSchema } from "../../lib/schemas";
import { Button, Card, Empty, PageHeading, Sheet } from "../../components/ui";
export default function Household() {
  const { state, setState, notify } = useDemo();
  const [text, setText] = useState("");
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="page">
      <PageHeading title={c.household.title} subtitle={c.household.subtitle} />
      <Card className="household-card">
        <div className="house-avatar">
          <Users size={28} />
        </div>
        <div>
          <h2>{state.household.name}</h2>
          <p>
            <MapPin size={13} />
            {state.household.city}
          </p>
        </div>
        <button
          className="icon-button"
          onClick={() => setEdit(true)}
          aria-label={c.settings.editHousehold}
        >
          <Pencil size={17} />
        </button>
      </Card>
      <div className="section-title small">
        <h2>{c.household.members}</h2>
        <span className="muted-text">{c.household.demoMembers}</span>
      </div>
      <Card className="members-card">
        <div className="member">
          <span className="avatar lavender">AS</span>
          <div>
            <h3>
              Ananya Sharma <small>({c.household.you})</small>
            </h3>
            <p>{c.household.owner}</p>
          </div>
          <span className="online-dot" />
        </div>
        <div className="member">
          <span className="avatar peach">RS</span>
          <div>
            <h3>Rohan Sharma</h3>
            <p>{c.household.member}</p>
          </div>
        </div>
      </Card>
      <div className="section-title list-heading">
        <div>
          <h2>{c.household.list}</h2>
          <p>{c.household.listCopy}</p>
        </div>
      </div>
      <form
        className="list-add"
        onSubmit={(e) => {
          e.preventDefault();
          const result = z.string().trim().min(1).max(120).safeParse(text);
          if (!result.success) {
            setError(c.common.required);
            return;
          }
          setState((s) => ({
            ...s,
            list: [
              ...s.list,
              { id: crypto.randomUUID(), text: result.data, done: false },
            ],
          }));
          setText("");
          setError("");
        }}
      >
        <input
          aria-label={c.household.placeholder}
          placeholder={c.household.placeholder}
          maxLength={120}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" aria-label={c.household.add}>
          <Plus size={21} />
        </Button>
      </form>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <Card className="shopping-list">
        {state.list.length ? (
          state.list.map((item) => (
            <div
              className={`shopping-row ${item.done ? "checked" : ""}`}
              key={item.id}
            >
              <label>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    setState((s) => ({
                      ...s,
                      list: s.list.map((row) =>
                        row.id === item.id ? { ...row, done: !row.done } : row,
                      ),
                    }))
                  }
                />
                <span className="custom-check">
                  {item.done && <Check size={13} />}
                </span>
                <span>{item.text}</span>
              </label>
              <button
                className="icon-button"
                aria-label={f(c.household.deleteItem, { name: item.text })}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    list: s.list.filter((row) => row.id !== item.id),
                  }))
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        ) : (
          <Empty
            title={c.household.empty}
            description={c.household.emptyCopy}
          />
        )}
      </Card>
      <p className="list-completed">
        {f(c.household.completed, {
          count: state.list.filter((i) => i.done).length,
        })}
      </p>
      <Card className="invite-card">
        <span className="invite-icon">
          <Users size={22} />
        </span>
        <h2>{c.household.invite}</h2>
        <p>{c.household.inviteCopy}</p>
        <button onClick={() => notify(c.household.inviteToast)}>
          {c.household.inviteAction}
          <ArrowUpRight size={16} />
        </button>
      </Card>
      {edit && (
        <Sheet title={c.household.create} onClose={() => setEdit(false)}>
          <HouseholdForm onComplete={() => setEdit(false)} />
        </Sheet>
      )}
    </div>
  );
}
export function HouseholdForm({ onComplete }: { onComplete: () => void }) {
  const { state, setState, notify } = useDemo();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof householdSchema>>({
    resolver: zodResolver(householdSchema),
    defaultValues: state.household,
  });
  return (
    <form
      className="household-form"
      onSubmit={handleSubmit((household) => {
        setState((s) => ({ ...s, household }));
        notify(c.household.saved);
        onComplete();
      })}
    >
      <label>
        {c.household.householdName}
        <input
          {...register("name")}
          placeholder={c.household.namePlaceholder}
        />
        {errors.name && (
          <span className="field-error">{errors.name.message}</span>
        )}
      </label>
      <label>
        {c.household.city}
        <input
          {...register("city")}
          placeholder={c.household.cityPlaceholder}
        />
        {errors.city && (
          <span className="field-error">{errors.city.message}</span>
        )}
      </label>
      <Button type="submit" className="full-width">
        {c.household.save}
      </Button>
    </form>
  );
}
export function Join() {
  return (
    <div className="page">
      <PageHeading
        title={c.household.joinTitle}
        subtitle={c.household.joinCopy}
      />
      <Link to="/" className="button button-primary">
        {c.household.explore}
      </Link>
    </div>
  );
}
