import { NavLink } from "react-router-dom";
import { LayoutGrid, ScanLine, Archive, Users } from "lucide-react";
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {[
        { to: "/", label: "Due Now", Icon: LayoutGrid },
        { to: "/add", label: "Add Photo", Icon: ScanLine },
        { to: "/pantry", label: "Pantry", Icon: Archive },
        { to: "/household", label: "Household", Icon: Users },
      ].map(({ to, label, Icon }) => (
        <NavLink to={to} end={to === "/"} key={to}>
          <Icon size={21} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
