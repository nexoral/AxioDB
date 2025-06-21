import path from "path";

export enum ServerKeys {
  PORT = 27018,
  LOCALHOST = "127.0.1",
}

export const staticPath = path.resolve(__dirname, "../public/AxioControl");
