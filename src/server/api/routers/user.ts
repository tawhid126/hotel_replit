import { z } from "zod";
import { hash } from "bcryptjs";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  // Register new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        phone: z.string().optional(),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await hash(input.password, 10);
      const userReferralCode = generateReferralCode();

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          phone: input.phone,
          referralCode: userReferralCode,
          referredBy: input.referralCode,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
      };
    }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        address: true,
        role: true,
        referralCode: true,
        referralBonus: true,
        smsEnabled: true,
        createdAt: true,
      },
    });
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        image: z.string().optional(),
        smsEnabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  // Get referral stats
  getReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return {
      referralCode: user?.referralCode,
      referralBonus: user?.referralBonus ?? 0,
      totalReferrals: user?.referrals.length ?? 0,
      referrals: user?.referrals ?? [],
      referralLink: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/signup?ref=${user?.referralCode}`,
    };
  }),

  // Get notifications
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  // Mark notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });
    }),

  // Mark all notifications as read
  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
  }),
});

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
