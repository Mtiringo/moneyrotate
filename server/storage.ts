import {
  users,
  pools,
  poolMembers,
  payments,
  payouts,
  messages,
  invitations,
  type User,
  type UpsertUser,
  type Pool,
  type PoolMember,
  type Payment,
  type Payout,
  type Message,
  type Invitation,
  type InsertPool,
  type InsertPoolMember,
  type InsertPayment,
  type InsertPayout,
  type InsertMessage,
  type InsertInvitation,
} from "../shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Pool operations
  createPool(pool: InsertPool): Promise<Pool>;
  getPool(id: string): Promise<Pool | undefined>;
  getUserPools(userId: string): Promise<Pool[]>;
  updatePool(id: string, updates: Partial<Pool>): Promise<Pool>;
  
  // Pool member operations
  addMemberToPool(member: InsertPoolMember): Promise<PoolMember>;
  getPoolMembers(poolId: string): Promise<(PoolMember & { user: User })[]>;
  removePoolMember(poolId: string, userId: string): Promise<void>;
  updateMemberPosition(poolId: string, userId: string, position: number): Promise<void>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPoolPayments(poolId: string): Promise<Payment[]>;
  getUserPayments(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<void>;
  
  // Payout operations
  createPayout(payout: InsertPayout): Promise<Payout>;
  getPoolPayouts(poolId: string): Promise<Payout[]>;
  getUpcomingPayouts(): Promise<Payout[]>;
  updatePayoutStatus(id: string, status: string, completedAt?: Date): Promise<void>;
  
  // Message operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getPoolMessages(poolId: string, limit?: number): Promise<(Message & { sender: User })[]>;
  
  // Invitation operations
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(token: string): Promise<Invitation | undefined>;
  updateInvitationStatus(token: string, status: string): Promise<void>;
  getPoolInvitations(poolId: string): Promise<Invitation[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Pool operations
  async createPool(poolData: InsertPool): Promise<Pool> {
    const [pool] = await db.insert(pools).values({
      ...poolData,
      monthlyAmount: poolData.monthlyAmount.toString()
    }).returning();
    return pool;
  }

  async getPool(id: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(eq(pools.id, id));
    return pool;
  }

  async getUserPools(userId: string): Promise<Pool[]> {
    const userPools = await db
      .select()
      .from(pools)
      .innerJoin(poolMembers, eq(pools.id, poolMembers.poolId))
      .where(eq(poolMembers.userId, userId))
      .orderBy(desc(pools.createdAt));
    
    return userPools.map(({ pools }) => pools);
  }

  async updatePool(id: string, updates: Partial<Pool>): Promise<Pool> {
    const [pool] = await db
      .update(pools)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pools.id, id))
      .returning();
    return pool;
  }

  // Pool member operations
  async addMemberToPool(memberData: InsertPoolMember): Promise<PoolMember> {
    const [member] = await db.insert(poolMembers).values(memberData).returning();
    return member;
  }

  async getPoolMembers(poolId: string): Promise<(PoolMember & { user: User })[]> {
    const members = await db
      .select()
      .from(poolMembers)
      .innerJoin(users, eq(poolMembers.userId, users.id))
      .where(eq(poolMembers.poolId, poolId))
      .orderBy(asc(poolMembers.position));
    
    return members.map(({ pool_members, users }) => ({
      ...pool_members,
      user: users,
    }));
  }

  async removePoolMember(poolId: string, userId: string): Promise<void> {
    await db
      .delete(poolMembers)
      .where(and(eq(poolMembers.poolId, poolId), eq(poolMembers.userId, userId)));
  }

  async updateMemberPosition(poolId: string, userId: string, position: number): Promise<void> {
    await db
      .update(poolMembers)
      .set({ position })
      .where(and(eq(poolMembers.poolId, poolId), eq(poolMembers.userId, userId)));
  }

  // Payment operations
  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getPoolPayments(poolId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.poolId, poolId))
      .orderBy(desc(payments.createdAt));
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<void> {
    const updates: any = { status };
    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    await db.update(payments).set(updates).where(eq(payments.id, id));
  }

  // Payout operations
  async createPayout(payoutData: InsertPayout): Promise<Payout> {
    const [payout] = await db.insert(payouts).values(payoutData).returning();
    return payout;
  }

  async getPoolPayouts(poolId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.poolId, poolId))
      .orderBy(desc(payouts.createdAt));
  }

  async getUpcomingPayouts(): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.status, "pending"))
      .orderBy(asc(payouts.scheduledFor));
  }

  async updatePayoutStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    const updates: any = { status };
    if (completedAt) {
      updates.completedAt = completedAt;
    }
    
    await db.update(payouts).set(updates).where(eq(payouts.id, id));
  }

  // Message operations
  async sendMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getPoolMessages(poolId: string, limit = 50): Promise<(Message & { sender: User })[]> {
    const poolMessages = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.poolId, poolId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return poolMessages.map(({ messages, users }) => ({
      ...messages,
      sender: users,
    })).reverse(); // Return in chronological order
  }

  // Invitation operations
  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    const [invitation] = await db
      .insert(invitations)
      .values({ ...invitationData, token })
      .returning();
    return invitation;
  }

  async getInvitation(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));
    return invitation;
  }

  async updateInvitationStatus(token: string, status: string): Promise<void> {
    await db
      .update(invitations)
      .set({ status })
      .where(eq(invitations.token, token));
  }

  async getPoolInvitations(poolId: string): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.poolId, poolId))
      .orderBy(desc(invitations.createdAt));
  }
}

import { MemStorage } from "./memStorage";

// Use in-memory storage for testing while database connection is being established
export const storage = process.env.NODE_ENV === "test" || !process.env.DATABASE_URL ? new MemStorage() : new DatabaseStorage();