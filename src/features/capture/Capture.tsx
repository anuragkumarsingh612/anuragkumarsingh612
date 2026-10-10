import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  ImagePlus,
  ReceiptText,
  ShoppingBasket,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { PageHeading, Button } from "../../components/ui";
import { copy as c } from "../../lib/i18n";
import { prepareImage } from "../../lib/image";
export default function Capture() {
  const [type, setType] = useState("bill");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  async function choose(file?: File) {
    if (!file) return;
    const id = ++request.current;
    setBusy(true);
    setError("");
    try {
      const blob = await prepareImage(file);
      if (id === request.current) setPreview(URL.createObjectURL(blob));
    } catch (err) {
      if (id === request.current)
        setError(err instanceof Error ? err.message : c.capture.failed);
    } finally {
      if (id === request.current) setBusy(false);
    }
  }
  return (
    <div className="page">
      <PageHeading title={c.capture.title} subtitle={c.capture.subtitle} />
      <div className="capture-types">
        {[
          { id: "bill", label: c.capture.bill, Icon: ReceiptText },
          { id: "order_screen", label: c.capture.order, Icon: Smartphone },
          { id: "items", label: c.capture.items, Icon: ShoppingBasket },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-pressed={type === id}
            className={type === id ? "selected" : ""}
            onClick={() => setType(id)}
          >
            <Icon size={22} />
            {label}
          </button>
        ))}
      </div>
      <div className={`photo-zone ${preview ? "has-preview" : ""}`}>
        {preview ? (
          <img src={preview} alt={c.capture.preview} />
        ) : (
          <>
            <div className="camera-illustration">
              <Camera size={38} strokeWidth={1.3} />
              <span>+</span>
            </div>
            <h2>{c.capture.dropTitle}</h2>
            <p>{c.capture.dropCopy}</p>
          </>
        )}
        <div className="photo-actions">
          <Button onClick={() => camera.current?.click()} disabled={busy}>
            <Camera size={18} />
            {preview ? c.capture.change : c.capture.camera}
          </Button>
          <Button
            variant="secondary"
            onClick={() => gallery.current?.click()}
            disabled={busy}
          >
            <ImagePlus size={18} />
            {c.capture.gallery}
          </Button>
        </div>
      </div>
      <input
        className="sr-only"
        tabIndex={-1}
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label={c.capture.camera}
        onChange={(e) => {
          void choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        className="sr-only"
        tabIndex={-1}
        ref={gallery}
        type="file"
        accept="image/*"
        aria-label={c.capture.gallery}
        onChange={(e) => {
          void choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div role="status" aria-live="polite" className="upload-status">
        {busy ? (
          <>
            <Loader2 className="spin" size={16} />
            {c.capture.processing}
          </>
        ) : preview ? (
          c.capture.ready
        ) : null}
      </div>
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
      <div className="inline-tip">
        <Lightbulb size={18} />
        {c.capture.tip}
      </div>
      <Link to="/confirm" className="text-link wide-link">
        {c.capture.manual}
        <ArrowRight size={18} />
      </Link>
      <div className="demo-notice">
        <span className="eyebrow">{c.settings.phase}</span>
        <p>{c.capture.demoNotice}</p>
        <Link to="/confirm?sample=1">
          {c.capture.sample}
          <ArrowRight size={15} />
        </Link>
      </div>
      <p className="privacy-block">
        <ShieldCheck size={17} />
        {c.capture.privacy}
      </p>
    </div>
  );
}
