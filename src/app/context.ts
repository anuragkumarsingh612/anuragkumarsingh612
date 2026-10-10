import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { DemoState } from "./demo";
type DemoContextValue = {
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  notify: (message: string) => void;
  storageError: boolean;
};
// Keep context identity stable when provider components refresh during development.
export const DemoContext = createContext<DemoContextValue | null>(null);
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("Missing demo provider");
  return context;
}
