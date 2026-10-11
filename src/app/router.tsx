import { lazy, Suspense } from "react";
import { createBrowserRouter, Link, useRouteError } from "react-router-dom";
import { Layout } from "./Layout";
import { Skeleton, Empty } from "../components/ui";
import { copy as c } from "../lib/i18n";
const Home = lazy(() => import("../features/due/Home"));
const Capture = lazy(() => import("../features/capture/Capture"));
const Confirm = lazy(() => import("../features/confirm/Confirm"));
const History = lazy(() => import("../features/history/History"));
const Household = lazy(() => import("../features/household/Household"));
const Join = lazy(() =>
  import("../features/household/Household").then((m) => ({ default: m.Join })),
);
const ItemDetail = lazy(() => import("../features/items/ItemDetail"));
const Settings = lazy(() => import("../features/settings/Settings"));
const Welcome = lazy(() => import("../features/auth/Welcome"));
function RouteError() {
  useRouteError();
  return (
    <div className="app-shell page">
      <Empty
        title={c.error.title}
        description={c.error.copy}
        action={c.error.reload}
        onAction={() => window.location.reload()}
      />
    </div>
  );
}
const page = (Component: React.ComponentType) => (
  <Suspense fallback={<Skeleton />}>
    <Component />
  </Suspense>
);
export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: page(Home) },
      { path: "add", element: page(Capture) },
      {
        path: "pantry",
        element: (
          <Suspense fallback={<Skeleton />}>
            <Home pantry />
          </Suspense>
        ),
      },
      { path: "confirm", element: page(Confirm) },
      { path: "history", element: page(History) },
      { path: "household", element: page(Household) },
      { path: "join/:token", element: page(Join) },
      { path: "items/:id", element: page(ItemDetail) },
      { path: "settings", element: page(Settings) },
      { path: "welcome", element: page(Welcome) },
      {
        path: "*",
        element: (
          <div className="page">
            <Empty
              title={c.error.notFound}
              description={c.error.notFoundCopy}
            />
            <Link to="/" className="button button-primary">
              {c.common.home}
            </Link>
          </div>
        ),
      },
    ],
  },
]);
