
import "dotenv/config";
import { google } from "googleapis";
import path from "node:path";

const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsJson && !keyFile) {
  throw new Error("Google Drive credentials are missing");
}

const auth = new google.auth.GoogleAuth({
  ...(credentialsJson
    ? { credentials: JSON.parse(credentialsJson) }
    : { keyFile: path.resolve(process.cwd(), keyFile!) }),
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

export const drive = google.drive({
  version: "v3",
  auth,
});
