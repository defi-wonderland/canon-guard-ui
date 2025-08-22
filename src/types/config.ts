import { CustomThemes } from "~/types";

export interface Env {
  IS_PLAYWRIGHT: boolean;
  PROJECT_ID: string;
  ALCHEMY_KEY: string;
}

export interface Constants {
  //...
  RPC_URL_TESTING: string;
}

export interface Config {
  env: Env;
  constants: Constants;
  customThemes: CustomThemes;
}
