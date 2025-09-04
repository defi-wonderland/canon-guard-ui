import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "~/containers";
import { SafeVault } from "~/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [{ index: true, path: "/", element: <SafeVault /> }],
  },
]);
