import { PrismaClient } from "@prisma/client";
import { buildApp } from "./app.ts";

const prisma = new PrismaClient();
const app = buildApp({ prisma });
const port = Number(process.env.PORT) || 8787;

app.listen({ port, host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
