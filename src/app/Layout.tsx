import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Archive,
  Plus,
  History,
  Users,
  Settings,
  ChevronDown,
  WifiOff,
  Bell,
  Sparkles,
  ArrowUpRight,
  Leaf,
  LayoutGrid,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { useDemo } from "./context";
import { isDue } from "./demo";
import { cycleForProduct } from "../lib/cycles";
import { supabase } from "../lib/supabase";
export function Layout() {
  const { state, storageError, notify } = useDemo();
  const { pathname } = useLocation();
  const [offline, setOffline] = useState(!navigator.onLine);
  const due = state.products
    .map((p) => cycleForProduct(p, state.purchases))
    .filter(isDue).length;
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
  const links = [
    { to: "/", label: "Due Now", Icon: LayoutGrid },
    { to: "/add", label: "Add Photo", Icon: Plus },
    { to: "/pantry", label: "My Pantry", Icon: Archive },
    { to: "/history", label: "Purchase History", Icon: History },
    { to: "/household", label: "Household", Icon: Users },
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="restoq-logo">
          restoq<span className="logo-spark">✳</span>
        </Link>
        <p className="brand-tagline">A little ahead. Always stocked.</p>
        <Link to="/household" className="house-selector">
          <span className="house-initial">S</span>
          <span>
            <strong>{state.household.name}</strong>
            <small>Personal household</small>
          </span>
          <ChevronDown size={15} />
        </Link>
        <span className="nav-caption">YOUR EVERYDAY, SORTED</span>
        <nav className="side-links" aria-label="Main navigation">
          {links.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === "/"}>
              <Icon size={19} />
              <span>{label}</span>
              {to === "/" && <em>{due}</em>}
              {to === "/add" && <span className="shortcut">＋</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-promise">
            <span className="promise-icon">
              <Leaf size={20} />
            </span>
            <h3>
              Less waste.
              <br />
              More peace of mind.
            </h3>
            <p>
              A happier home starts with
              <br />a thoughtful little habit.
            </p>
            <Link to="/add">
              Let’s build yours <ArrowUpRight size={15} />
            </Link>
          </div>
          <NavLink to="/settings" className="settings-link">
            <Settings size={18} /> Settings & preferences
          </NavLink>
          <div className="sidebar-foot">
            <span className="tiny-dot" /> Made for your everyday{" "}
            <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <div className="header-breadcrumb">
            <span className="desktop-label">Your household</span>
            <span className="breadcrumb-slash">/</span>
            <strong>
              {pathname === "/"
                ? "Overview"
                : pathname === "/add"
                  ? "Add Photo"
                  : pathname === "/confirm"
                    ? "Review receipt"
                    : pathname === "/pantry"
                      ? "My Pantry"
                      : "Your space"}
            </strong>
          </div>
          <Link to="/" className="restoq-logo mobile-logo">
            restoq✳
          </Link>
          <div className="header-right">
            <span className="local-status">
              <span className="tiny-dot" />{" "}
              {supabase ? "Connected household" : "Demo household"}
            </span>
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() =>
                notify(
                  due
                    ? `${due} essentials are ready for a restock. You’re in the right place!`
                    : "All stocked up. No reminders right now.",
                )
              }
            >
              <Bell size={19} />
              <i />
            </button>
            <Link
              to="/household"
              className="profile-avatar"
              aria-label="Household profile"
            >
              AS
            </Link>
          </div>
        </header>
        {offline && (
          <div className="status-banner" role="status">
            <WifiOff size={16} />
            You’re offline. Your saved pantry is still here.
          </div>
        )}
        {storageError && (
          <div className="error-banner" role="alert">
            Changes couldn’t be saved on this device.
          </div>
        )}
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            <Sparkles size={13} /> A little less to remember. A little more room
            to live.
          </span>
          <span>Thoughtfully made for your home.</span>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
