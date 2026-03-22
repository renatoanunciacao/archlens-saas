import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env file manually
const envContent = readFileSync(resolve(".env"), "utf-8");
const envLines = envContent.split("\n");
envLines.forEach((line) => {
  if (line && !line.startsWith("#")) {
    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
});

const client = postgres(process.env.DATABASE_URL);

try {
  // Drop drizzle migrations tracking
  await client`DROP TABLE IF EXISTS "drizzle"."__drizzle_migrations" CASCADE`;
  console.log("✓ Dropped __drizzle_migrations");
  
  // Drop all application tables
  await client`DROP TABLE IF EXISTS "payments" CASCADE`;
  await client`DROP TABLE IF EXISTS "analyses" CASCADE`;
  await client`DROP TABLE IF EXISTS "projects" CASCADE`;
  await client`DROP TABLE IF EXISTS "usage_limits" CASCADE`;
  await client`DROP TABLE IF EXISTS "subscriptions" CASCADE`;
  await client`DROP TABLE IF EXISTS "sessions" CASCADE`;
  await client`DROP TABLE IF EXISTS "accounts" CASCADE`;
  await client`DROP TABLE IF EXISTS "users" CASCADE`;
  await client`DROP TABLE IF EXISTS "verification_tokens" CASCADE`;
  console.log("✓ Dropped application tables");
  
  // Drop schema
  await client`DROP SCHEMA IF EXISTS "drizzle" CASCADE`;
  console.log("✓ Dropped drizzle schema");
  
  console.log("Database reset successfully!");
} catch (error) {
  console.error("Error resetting database:", error);
  console.error("Full error:", JSON.stringify(error, null, 2));
} finally {
  await client.end();
}
