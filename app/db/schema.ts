import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_unique").on(table.email),
}));

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (table) => ({
  compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
  providerAccountIdx: uniqueIndex("accounts_provider_account_unique").on(
    table.provider,
    table.providerAccountId,
  ),
}));

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.identifier, table.token],
    }),
  }),
);


export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  plan: text("plan").default("free").notNull(),
  status: text("status").default("active").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  externalCustomerId: text("external_customer_id"),
  externalSubId: text("external_sub_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("subscriptions_user_unique").on(table.userId),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  provider: text("provider"),
  repoUrl: text("repo_url"),
  repoName: text("repo_name"),
  branch: text("branch"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull(),
  structuralHealthScore: integer("structural_health_score").notNull(),
  structuralHealthGrade: text("structural_health_grade").notNull(),
  architectureFitScore: integer("architecture_fit_score"),
  architectureFitStatus: text("architecture_fit_status"),
  reportJson: jsonb("report_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageLimits = pgTable("usage_limits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  projectsCount: integer("projects_count").default(0).notNull(),
  analysesCountMonth: integer("analyses_count_month").default(0).notNull(),
  maxProjects: integer("max_projects").default(2).notNull(),
  maxAnalysesPerMonth: integer("max_analyses_per_month").default(20).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userUnique: uniqueIndex("usage_limits_user_unique").on(table.userId),
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  provider: text("provider").notNull(),
  amountInCents: integer("amount_in_cents").notNull(),
  currency: text("currency").default("BRL").notNull(),
  status: text("status").notNull(),
  externalPaymentId: text("external_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analysisJobs = pgTable("analysis_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").notNull(),
  userId: uuid("user_id").notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  progress: integer("progress").default(0).notNull(), // 0-100
  message: text("message"), // Current status message
  analysisId: uuid("analysis_id"), // Set after completion
  error: text("error"), // Error message if failed
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectIdx: uniqueIndex("analysis_jobs_project_idx").on(table.projectId, table.status),
  userIdx: uniqueIndex("analysis_jobs_user_pending_idx").on(table.userId),
}));

export const analysisJobProgress = pgTable("analysis_job_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: uuid("job_id").notNull(),
  step: integer("step").notNull(), // 1-5
  stepName: text("step_name").notNull(), // "cloning", "analyzing", "parsing", "saving", "completed"
  progress: integer("progress").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});