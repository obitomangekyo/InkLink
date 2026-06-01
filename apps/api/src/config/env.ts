import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_ENV: z.enum(["development", "staging", "production"]),
    HOST: z.string().trim().min(1),
    MONGODB_URI: z.url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.coerce.number().int().positive()
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true
});

export const isProduction = env.NODE_ENV === "production";
