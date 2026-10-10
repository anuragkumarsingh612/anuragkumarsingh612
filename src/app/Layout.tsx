import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { ShoppingBasket, Settings, ChevronDown, WifiOff } from "lucide-react";
import { APP_NAME } from "./config";
import { BottomNav } from "../components/BottomNav";
import { useDemo } from "./context";
import { copy } from "../lib/i18n";
export function Layout() {
  const { state, storageError } = useDemo();
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link
          to="/"
          className="brand"
          aria-label={`${APP_NAME} ${copy.common.home}`}
        >
          <span className="brand-icon">
            <ShoppingBasket size={23} strokeWidth={1.8} />
          </span>
          {APP_NAME}
          <span className="brand-period">.</span>
        </Link>
        <div className="header-right">
          <span className="demo-pill">
            <span />
            {copy.common.demo}
          </span>
          <Link
            to="/settings"
            className="icon-button"
            aria-label={copy.common.settings}
          >
            <Settings size={19} />
          </Link>
        </div>
      </header>
      <nav className="household-bar" aria-label={copy.common.household}>
        <Link to="/household">
          <span className="household-dot" />
          {state.household.name}
          <ChevronDown size={14} />
        </Link>
        <span>{state.household.city}</span>
      </nav>
      {offline && (
        <div className="status-banner" role="status">
          <WifiOff size={16} />
          {copy.common.offline}
        </div>
      )}
      {storageError && (
        <div className="error-banner" role="alert">
          {copy.common.localError}
        </div>
      )}
      <main id="main-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
