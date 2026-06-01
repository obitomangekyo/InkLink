import path from "node:path";
import { boardVisibilityOptions } from "@inklink/shared";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env, isProduction } from "./config/env.js";

const app = express();
const webDistPath = path.resolve(process.cwd(), "apps/web/dist");
const devWebOrigin = "http://localhost:5173";

app.use(helmet());
if (!isProduction) {
  app.use(
    cors({
      origin: devWebOrigin
    })
  );
}
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({
    ok: true,
    service: "inklink-api",
    boardVisibilityOptions
  });
});

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "inklink-api",
    boardVisibilityOptions
  });
});

if (isProduction) {
  app.use(express.static(webDistPath));

  app.use((_request, response) => {
    response.sendFile(path.join(webDistPath, "index.html"));
  });
}

app.listen(env.PORT, env.HOST, () => {
  console.log(`InkLink API listening on http://${env.HOST}:${env.PORT}`);
});
