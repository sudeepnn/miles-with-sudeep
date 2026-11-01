import "dotenv/config";

import express from "express";
import cors from "cors";
import galleryRoutes from "./routes/gallery.routes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://miles-with-sudeep.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "Drive Photography API"
  });
});

app.use("/api/gallery", galleryRoutes);

app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error(error);

  res.status(500).json({
    message: "Something went wrong while accessing Google Drive"
  });
});

export default app;

// Run a local server during development.
// Vercel imports the Express app as a serverless function.
if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 5000;

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });
}