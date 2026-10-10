import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { GroceryArt } from "../../components/Artwork";
import { Button } from "../../components/ui";
import { copy as c } from "../../lib/i18n";
import { useDemo } from "../../app/context";
export default function Welcome() {
  const { notify } = useDemo();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="page welcome-page">
      <div className="welcome-art">
        <GroceryArt />
      </div>
      <span className="eyebrow">{c.auth.eyebrow}</span>
      <h1>{c.auth.pitch}</h1>
      <p>{c.auth.copy}</p>
      <Button onClick={() => notify(c.auth.unavailable)} className="full-width">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4ZM12 22c2.7 0 5-0.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22ZM6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6ZM12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6A6 6 0 0 1 12 6Z" />
        </svg>
        {c.auth.google}
      </Button>
      {showEmail ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!z.string().email().safeParse(email).success) {
              setError(c.auth.emailInvalid);
              return;
            }
            setError("");
            notify(c.auth.unavailable);
          }}
        >
          <label>
            {c.auth.emailLabel}
            <input
              type="email"
              value={email}
              placeholder={c.auth.emailPlaceholder}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="field-error">{error}</p>}
          <Button variant="secondary" type="submit" className="full-width">
            {c.auth.email}
          </Button>
        </form>
      ) : (
        <Button
          variant="secondary"
          className="full-width"
          onClick={() => setShowEmail(true)}
        >
          <Mail size={18} />
          {c.auth.email}
        </Button>
      )}
      <Link className="text-link" to="/">
        {c.auth.explore}
        <ArrowRight size={16} />
      </Link>
      <p className="privacy-block">
        <ShieldCheck size={18} />
        {c.auth.privacy}
      </p>
      <p className="demo-disclosure">{c.settings.phaseCopy}</p>
    </div>
  );
}
