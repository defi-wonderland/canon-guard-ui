import { Env } from "~/types";

const env: Env = {
  IS_PLAYWRIGHT: import.meta.env.VITE_PUBLIC_IS_PLAYWRIGHT === "true",
  PROJECT_ID: import.meta.env.VITE_PUBLIC_PROJECT_ID as string,
  RPC_URL_TESTING: import.meta.env.RPC_URL_TESTING || "http://127.0.0.1:8545",
};

export const getEnv = (): Env => {
  return env;
};
