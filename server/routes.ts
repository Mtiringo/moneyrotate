import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPoolSchema, 
  insertPoolMemberSchema, 
  insertMessageSchema,
  insertInvitationSchema 
} from "../shared/schema";
import { z } from "zod";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Pool routes
  app.post("/api/pools", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poolData = insertPoolSchema.parse({ ...req.body, adminId: userId });
      
      const pool = await storage.createPool(poolData);
      
      // Add creator as first member
      await storage.addMemberToPool({
        poolId: pool.id,
        userId: userId,
        position: 1,
      });
      
      res.json(pool);
    } catch (error) {
      console.error("Error creating pool:", error);
      res.status(400).json({ message: "Failed to create pool" });
    }
  });

  app.get("/api/pools", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pools = await storage.getUserPools(userId);
      res.json(pools);
    } catch (error) {
      console.error("Error fetching pools:", error);
      res.status(500).json({ message: "Failed to fetch pools" });
    }
  });

  app.get("/api/pools/:id", isAuthenticated, async (req: any, res) => {
    try {
      const pool = await storage.getPool(req.params.id);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      
      const members = await storage.getPoolMembers(pool.id);
      const messages = await storage.getPoolMessages(pool.id, 50);
      const payouts = await storage.getPoolPayouts(pool.id);
      
      res.json({ pool, members, messages, payouts });
    } catch (error) {
      console.error("Error fetching pool:", error);
      res.status(500).json({ message: "Failed to fetch pool" });
    }
  });

  // Pool member routes
  app.post("/api/pools/:poolId/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const poolId = req.params.poolId;
      
      const pool = await storage.getPool(poolId);
      if (!pool) {
        return res.status(404).json({ message: "Pool not found" });
      }
      
      const members = await storage.getPoolMembers(poolId);
      const nextPosition = members.length + 1;
      
      const member = await storage.addMemberToPool({
        poolId,
        userId,
        position: nextPosition,
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error joining pool:", error);
      res.status(400).json({ message: "Failed to join pool" });
    }
  });

  // Message routes
  app.post("/api/pools/:poolId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({
        ...req.body,
        poolId: req.params.poolId,
        senderId: userId,
      });
      
      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Invitation routes
  app.post("/api/pools/:poolId/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitationData = insertInvitationSchema.parse({
        ...req.body,
        poolId: req.params.poolId,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      const invitation = await storage.createInvitation(invitationData);
      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(400).json({ message: "Failed to create invitation" });
    }
  });

  app.post("/api/invitations/:token/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invitation = await storage.getInvitation(req.params.token);
      
      if (!invitation || invitation.status !== "pending") {
        return res.status(404).json({ message: "Invalid invitation" });
      }
      
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation expired" });
      }
      
      const members = await storage.getPoolMembers(invitation.poolId);
      const nextPosition = members.length + 1;
      
      await storage.addMemberToPool({
        poolId: invitation.poolId,
        userId,
        position: nextPosition,
      });
      
      await storage.updateInvitationStatus(req.params.token, "accepted");
      
      res.json({ message: "Invitation accepted" });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(400).json({ message: "Failed to accept invitation" });
    }
  });

  // Payment routes (Stripe integration)
  if (stripe) {
    app.post("/api/pools/:poolId/payment-intent", isAuthenticated, async (req: any, res) => {
      try {
        const pool = await storage.getPool(req.params.poolId);
        if (!pool) {
          return res.status(404).json({ message: "Pool not found" });
        }
        
        const amount = Math.round(parseFloat(pool.monthlyAmount) * 100); // Convert to cents
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          metadata: {
            poolId: pool.id,
            userId: req.user.claims.sub,
          },
        });
        
        await storage.createPayment({
          poolId: pool.id,
          userId: req.user.claims.sub,
          amount: pool.monthlyAmount,
          status: "pending",
          forMonth: new Date(),
          stripePaymentIntentId: paymentIntent.id,
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });

    app.post("/api/stripe/webhook", async (req, res) => {
      const sig = req.headers['stripe-signature'];
      
      try {
        const event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
        
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const { poolId, userId } = paymentIntent.metadata;
          
          // Update payment status
          await storage.updatePaymentStatus(paymentIntent.id, "completed", paymentIntent.id);
          
          // Send system message
          await storage.sendMessage({
            poolId,
            senderId: userId,
            content: "Payment received successfully",
            messageType: "system",
          });
        }
        
        res.json({ received: true });
      } catch (err: any) {
        console.error('Webhook signature verification failed.', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}