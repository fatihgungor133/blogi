import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '51.91.224.191',
  user: process.env.DB_USER || 'yuzyil_44',
  password: process.env.DB_PASSWORD || 'TJ^[u_=oBI)t',
  database: process.env.DB_NAME || 'yuzyil_44',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

//Drizzle-ORM integration is not directly supported by the mysql2 package
//To use drizzle with mysql2, you'll need to find a compatible adapter.
//The following lines are commented out because they are incompatible with the new MySQL setup.

//import { drizzle } from 'drizzle-orm/neon-serverless';
//import * as schema from "@shared/schema";
//export const db = drizzle({ client: pool, schema });