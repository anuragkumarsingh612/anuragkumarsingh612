import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight, X, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { copy } from "../../lib/i18n";
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Skeleton() {
  return (
    <div
      className="page skeleton-page"
      role="status"
      aria-label={copy.common.loading}
    >
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-36" />
      ))}
    </div>
  );
}
export function PageHeading({
  title,
  subtitle,
  back = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="page-heading">
      {back && (
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={17} />
          {copy.common.back}
        </button>
      )}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Sprout size={28} />
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && (
        <Button onClick={onAction}>
          {action}
          <ArrowRight size={17} />
        </Button>
      )}
    </div>
  );
}
export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const active = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="sheet-title"
    >
      <div className="sheet-handle" />
      <header>
        <h2 id="sheet-title">{title}</h2>
        <button
          className="icon-button"
          aria-label={copy.common.close}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
