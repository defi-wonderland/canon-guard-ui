import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "~/containers";
import { SafeVault, TestPage } from "~/pages";

// Lazy load the route components to avoid circular dependencies
// These will be rendered inside CanonGuardApp via Outlet
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // Landing page - Safe selection
      { index: true, element: <SafeVault /> },
      // Main app routes (all render SafeVault which handles auth and shows CanonGuardApp)
      { path: "queue", element: <SafeVault /> },
      { path: "queue/sign", element: <SafeVault /> },
      { path: "queue-action", element: <SafeVault /> },
      { path: "canon-list", element: <SafeVault /> },
      { path: "settings", element: <SafeVault /> },
      { path: "settings/attach", element: <SafeVault /> },
      { path: "settings/detach", element: <SafeVault /> },
      {
        path: "create",
        element: <SafeVault />,
        children: [
          { index: true, element: null }, // Main create view
          {
            path: "action",
            element: null,
            children: [
              { index: true, element: null }, // Select factory
              { path: "transfer", element: null }, // Transfer form (review is internal state)
              { path: "arbitrary-action", element: null }, // Arbitrary action form
              { path: "claim-allowance", element: null }, // Claim allowance form
              { path: "turn-off-emergency", element: null }, // Turn off emergency mode signing flow
            ],
          },
          {
            path: "hub",
            element: null,
            children: [
              { index: true, element: null }, // Select hub type
              { path: "capped-transfer", element: null }, // Capped transfer hub form
            ],
          },
          {
            path: "hub-child/:hubAddress",
            element: null, // Deploy child from hub
          },
        ],
      },
      // Test route for design iteration (temporary)
      { path: "test", element: <TestPage /> },
      // Catch-all redirect to home
      { path: "*", element: <Navigate to='/' replace /> },
    ],
  },
]);
