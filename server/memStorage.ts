import { IStorage } from "./storage";
import { 
  User, 
  UpsertUser, 
  Pool, 
  InsertPool, 
  PoolMember, 
  InsertPoolMember, 
  Payment, 
  InsertPayment, 
  Payout, 
  InsertPayout, 
  Message, 
  InsertMessage, 
  Invitation, 
  InsertInvitation 
} from "../shared/schema";

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private pools: Map<string, Pool> = new Map();
  private poolMembers: Map<string, PoolMember[]> = new Map();
  private payments: Map<string, Payment[]> = new Map();
  private payouts: Map<string, Payout[]> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private invitations: Map<string, Invitation> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async createPool(poolData: InsertPool): Promise<Pool> {
    const pool: Pool = {
      id: `pool_${Date.now()}`,
      name: poolData.name,
      description: poolData.description || null,
      monthlyAmount: poolData.monthlyAmount,
      adminId: poolData.adminId,
      isActive: true,
      currentRound: 1,
      startDate: poolData.startDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pools.set(pool.id, pool);
    return pool;
  }

  async getPool(id: string): Promise<Pool | undefined> {
    return this.pools.get(id);
  }

  async getUserPools(userId: string): Promise<Pool[]> {
    const userPools: Pool[] = [];
    for (const [poolId, pool] of this.pools) {
      const members = this.poolMembers.get(poolId) || [];
      if (pool.adminId === userId || members.some(m => m.userId === userId)) {
        userPools.push(pool);
      }
    }
    return userPools;
  }

  async updatePool(id: string, updates: Partial<Pool>): Promise<Pool> {
    const pool = this.pools.get(id);
    if (!pool) throw new Error("Pool not found");
    const updatedPool = { ...pool, ...updates, updatedAt: new Date() };
    this.pools.set(id, updatedPool);
    return updatedPool;
  }

  async addMemberToPool(memberData: InsertPoolMember): Promise<PoolMember> {
    const member: PoolMember = {
      id: `member_${Date.now()}`,
      poolId: memberData.poolId,
      userId: memberData.userId,
      position: memberData.position,
      hasReceived: false,
      joinedAt: new Date(),
    };
    
    const members = this.poolMembers.get(memberData.poolId) || [];
    members.push(member);
    this.poolMembers.set(memberData.poolId, members);
    return member;
  }

  async getPoolMembers(poolId: string): Promise<(PoolMember & { user: User })[]> {
    const members = this.poolMembers.get(poolId) || [];
    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId)!
    }));
  }

  async removePoolMember(poolId: string, userId: string): Promise<void> {
    const members = this.poolMembers.get(poolId) || [];
    const filtered = members.filter(m => m.userId !== userId);
    this.poolMembers.set(poolId, filtered);
  }

  async updateMemberPosition(poolId: string, userId: string, position: number): Promise<void> {
    const members = this.poolMembers.get(poolId) || [];
    const member = members.find(m => m.userId === userId);
    if (member) {
      member.position = position;
    }
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      id: `payment_${Date.now()}`,
      poolId: paymentData.poolId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      status: paymentData.status,
      forMonth: paymentData.forMonth,
      stripePaymentIntentId: paymentData.stripePaymentIntentId || null,
      createdAt: new Date(),
      completedAt: null,
    };
    
    const payments = this.payments.get(paymentData.poolId) || [];
    payments.push(payment);
    this.payments.set(paymentData.poolId, payments);
    return payment;
  }

  async getPoolPayments(poolId: string): Promise<Payment[]> {
    return this.payments.get(poolId) || [];
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    const userPayments: Payment[] = [];
    for (const payments of this.payments.values()) {
      userPayments.push(...payments.filter(p => p.userId === userId));
    }
    return userPayments;
  }

  async updatePaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<void> {
    for (const payments of this.payments.values()) {
      const payment = payments.find(p => p.id === id);
      if (payment) {
        payment.status = status;
        if (stripePaymentIntentId) payment.stripePaymentIntentId = stripePaymentIntentId;
        if (status === "completed") payment.completedAt = new Date();
        break;
      }
    }
  }

  async createPayout(payoutData: InsertPayout): Promise<Payout> {
    const payout: Payout = {
      id: `payout_${Date.now()}`,
      poolId: payoutData.poolId,
      userId: payoutData.userId,
      amount: payoutData.amount,
      round: payoutData.round,
      status: payoutData.status,
      scheduledFor: payoutData.scheduledFor,
      createdAt: new Date(),
      completedAt: null,
    };
    
    const payouts = this.payouts.get(payoutData.poolId) || [];
    payouts.push(payout);
    this.payouts.set(payoutData.poolId, payouts);
    return payout;
  }

  async getPoolPayouts(poolId: string): Promise<Payout[]> {
    return this.payouts.get(poolId) || [];
  }

  async getUpcomingPayouts(): Promise<Payout[]> {
    const upcoming: Payout[] = [];
    for (const payouts of this.payouts.values()) {
      upcoming.push(...payouts.filter(p => p.status === "pending"));
    }
    return upcoming;
  }

  async updatePayoutStatus(id: string, status: string, completedAt?: Date): Promise<void> {
    for (const payouts of this.payouts.values()) {
      const payout = payouts.find(p => p.id === id);
      if (payout) {
        payout.status = status;
        if (completedAt) payout.completedAt = completedAt;
        break;
      }
    }
  }

  async sendMessage(messageData: InsertMessage): Promise<Message> {
    const message: Message = {
      id: `message_${Date.now()}`,
      poolId: messageData.poolId,
      senderId: messageData.senderId,
      content: messageData.content,
      messageType: messageData.messageType || "user",
      createdAt: new Date(),
    };
    
    const messages = this.messages.get(messageData.poolId) || [];
    messages.push(message);
    this.messages.set(messageData.poolId, messages);
    return message;
  }

  async getPoolMessages(poolId: string, limit = 50): Promise<(Message & { sender: User })[]> {
    const messages = this.messages.get(poolId) || [];
    return messages.slice(-limit).map(message => ({
      ...message,
      sender: this.users.get(message.senderId)!
    }));
  }

  async createInvitation(invitationData: InsertInvitation): Promise<Invitation> {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invitation: Invitation = {
      id: `invitation_${Date.now()}`,
      poolId: invitationData.poolId,
      email: invitationData.email,
      invitedBy: invitationData.invitedBy,
      token,
      status: "pending",
      expiresAt: invitationData.expiresAt,
      createdAt: new Date(),
    };
    
    this.invitations.set(token, invitation);
    return invitation;
  }

  async getInvitation(token: string): Promise<Invitation | undefined> {
    return this.invitations.get(token);
  }

  async updateInvitationStatus(token: string, status: string): Promise<void> {
    const invitation = this.invitations.get(token);
    if (invitation) {
      invitation.status = status;
    }
  }

  async getPoolInvitations(poolId: string): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(inv => inv.poolId === poolId);
  }
}