import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // REQUIRED for prisma migrate dev
  datasource: {
    url: process.env.DATABASE_URL,
  },

  migrate: {
    path: "prisma/migrations",
  },
});
