import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  stripeCustomerId: varchar("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Money pools/groups table
export const pools = pgTable("pools", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true),
  currentRound: integer("current_round").default(1),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pool members table
export const poolMembers = pgTable("pool_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id").references(() => pools.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  position: integer("position").notNull(), // Position in payout rotation
  hasReceived: boolean("has_received").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id").references(() => pools.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status").notNull(), // pending, completed, failed
  forMonth: timestamp("for_month").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payouts table
export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id").references(() => pools.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  round: integer("round").notNull(),
  status: varchar("status").notNull(), // pending, completed, failed
  scheduledFor: timestamp("scheduled_for").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id").references(() => pools.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, system
  createdAt: timestamp("created_at").defaultNow(),
});

// Invitations table
export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  poolId: uuid("pool_id").references(() => pools.id).notNull(),
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  token: varchar("token").unique().notNull(),
  status: varchar("status").default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Pool = typeof pools.$inferSelect;
export type PoolMember = typeof poolMembers.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPoolSchema = createInsertSchema(pools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentRound: true,
}).extend({
  monthlyAmount: z.coerce.number().min(1, "Monthly amount must be greater than 0"),
});

export const insertPoolMemberSchema = createInsertSchema(poolMembers).omit({
  id: true,
  joinedAt: true,
  hasReceived: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutSchema = createInsertSchema(payouts).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  createdAt: true,
  token: true,
});

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPool = z.infer<typeof insertPoolSchema>;
export type InsertPoolMember = z.infer<typeof insertPoolMemberSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;