import { NavLink } from "react-router-dom";
import { House, Plus, History, Users } from "lucide-react";
import { copy } from "../lib/i18n";
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label={copy.common.home}>
      <NavLink to="/" end>
        <House size={21} />
        <span>{copy.common.home}</span>
      </NavLink>
      <NavLink
        to="/add"
        className={({ isActive }) => `nav-add ${isActive ? "active" : ""}`}
      >
        <span className="fab">
          <Plus size={27} />
        </span>
        <span>{copy.common.add}</span>
      </NavLink>
      <NavLink to="/history">
        <History size={21} />
        <span>{copy.common.history}</span>
      </NavLink>
      <NavLink to="/household">
        <Users size={21} />
        <span>{copy.common.household}</span>
      </NavLink>
    </nav>
  );
}
