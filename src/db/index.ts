import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Use pgbouncer (transaction mode) for serverless/edge functions
const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString, {
  prepare: false, // required for pgbouncer transaction mode
})

export const db = drizzle(client, { schema })
