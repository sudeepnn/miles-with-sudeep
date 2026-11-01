import { google } from "googleapis";
import path from "node:path";

const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyFile) {
  throw new Error("Google credentials path is missing");
}

const auth = new google.auth.GoogleAuth({
  keyFile: path.resolve(process.cwd(), keyFile),
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly"
  ]
});

export const drive = google.drive({
  version: "v3",
  auth
});