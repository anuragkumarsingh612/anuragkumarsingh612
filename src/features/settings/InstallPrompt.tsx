import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { copy as c } from "../../lib/i18n";
import { useDemo } from "../../app/context";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let pendingPrompt: InstallEvent | null = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pendingPrompt = event as InstallEvent;
  window.dispatchEvent(new Event("install-ready"));
});
export function InstallPrompt() {
  const { state, notify } = useDemo();
  const [available, setAvailable] = useState(!!pendingPrompt);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const ready = () => setAvailable(true);
    const installed = () => {
      setAvailable(false);
      setDismissed(true);
      pendingPrompt = null;
    };
    window.addEventListener("install-ready", ready);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("install-ready", ready);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  if (
    !state.savedOnce ||
    dismissed ||
    window.matchMedia("(display-mode: standalone)").matches
  )
    return null;
  return (
    <div className="install-card">
      <Download size={21} />
      <div>
        <h2>{c.settings.install}</h2>
        <p>{c.settings.installCopy}</p>
        <button
          className="text-link"
          onClick={async () => {
            if (available && pendingPrompt) {
              try {
                await pendingPrompt.prompt();
                await pendingPrompt.userChoice;
                pendingPrompt = null;
                setDismissed(true);
              } catch {
                notify(c.settings.installUnavailable);
              }
            } else notify(c.settings.installUnavailable);
          }}
        >
          {c.settings.install}
        </button>
      </div>
      <button
        className="icon-button"
        aria-label={c.settings.installDismiss}
        onClick={() => setDismissed(true)}
      >
        <X size={17} />
      </button>
    </div>
  );
}
