import { useEffect, useState, useCallback, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initialState, stateSchema } from "./demo";
import { copy } from "../lib/i18n";
import { DemoContext } from "./context";
const KEY = "restock-demo-v1";
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
// Restore only validated demo data; the context stays stable across hot reloads.
function readState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const result = stateSchema.safeParse(JSON.parse(raw));
      if (result.success) return result.data;
    }
  } catch {
    /* Fall back to a safe demo when browser storage is unavailable. */
  }
  return initialState();
}
export function Providers({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readState);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(
    null,
  );
  const notify = useCallback(
    (message: string) => setToast({ message, id: Date.now() }),
    [],
  );
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  return (
    <QueryClientProvider client={queryClient}>
      <DemoContext.Provider value={{ state, setState, notify, storageError }}>
        {children}
        <div className="toast-container" role="status" aria-live="polite">
          {toast && (
            <div className="toast" key={toast.id}>
              <span className="toast-dot" />
              {toast.message}
              <button
                aria-label={copy.common.close}
                onClick={() => setToast(null)}
              >
                ×
              </button>
            </div>
          )}
        </div>
      </DemoContext.Provider>
    </QueryClientProvider>
  );
}
