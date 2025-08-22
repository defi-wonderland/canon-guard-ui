import { Env } from "~/types";

const env: Env = {
  IS_PLAYWRIGHT: import.meta.env.VITE_PUBLIC_IS_PLAYWRIGHT === "true",
  PROJECT_ID: import.meta.env.VITE_PUBLIC_PROJECT_ID as string,
  ALCHEMY_KEY: import.meta.env.VITE_PUBLIC_ALCHEMY_KEY as string,
};

export const getEnv = (): Env => {
  return env;
};
