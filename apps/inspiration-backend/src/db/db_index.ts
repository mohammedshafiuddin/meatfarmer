import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import path from "path"
import * as schema from "./schema"

const db = drizzle({ connection: process.env.DATABASE_URL!, casing: "snake_case", schema: schema })
// const db = drizzle('postgresql://postgres:postgres@localhost:2345/pooler');
export { db }
