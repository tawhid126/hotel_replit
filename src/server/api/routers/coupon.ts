import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const couponRouter = createTRPCRouter({
  // Get active coupons (public - for banner)
  getActive: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    
    const coupons = await ctx.db.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: {
        discount: 'desc',
      },
      take: 10, // Limit to top 10 offers
    });

    // Filter coupons that haven't reached usage limit
    const availableCoupons = coupons.filter(coupon => 
      !coupon.usageLimit || coupon.usedCount < coupon.usageLimit
    );

    return { coupons: availableCoupons };
  }),

  // Check coupon validity
  validate: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        amount: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const coupon = await ctx.db.coupon.findUnique({
        where: { code: input.code },
      });

      if (!coupon) {
        return { valid: false, message: "Invalid coupon code" };
      }

      if (!coupon.isActive) {
        return { valid: false, message: "Coupon is not active" };
      }

      const now = new Date();
      if (coupon.validFrom > now) {
        return { valid: false, message: "Coupon is not yet valid" };
      }

      if (coupon.validTo < now) {
        return { valid: false, message: "Coupon has expired" };
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, message: "Coupon usage limit reached" };
      }

      if (coupon.minAmount && input.amount < coupon.minAmount) {
        return {
          valid: false,
          message: `Minimum amount ${coupon.minAmount} BDT required`,
        };
      }

      // Calculate discount
      let discount = coupon.isPercentage
        ? (input.amount * coupon.discount) / 100
        : coupon.discount;

      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }

      return {
        valid: true,
        discount,
        finalAmount: input.amount - discount,
      };
    }),

  // Admin: Get all coupons
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const coupons = await ctx.db.coupon.findMany({
        skip,
        take: input.limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.coupon.count();

      return {
        coupons,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Admin: Create coupon
  create: adminProcedure
    .input(
      z.object({
        code: z.string(),
        description: z.string().optional(),
        discount: z.number().min(0),
        isPercentage: z.boolean().default(true),
        minAmount: z.number().optional(),
        maxDiscount: z.number().optional(),
        validFrom: z.date(),
        validTo: z.date(),
        usageLimit: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.coupon.create({
        data: {
          ...input,
          isActive: true,
          usedCount: 0,
        },
      });
    }),

  // Admin: Update coupon
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        discount: z.number().min(0).optional(),
        isPercentage: z.boolean().optional(),
        minAmount: z.number().optional(),
        maxDiscount: z.number().optional(),
        validFrom: z.date().optional(),
        validTo: z.date().optional(),
        usageLimit: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.coupon.update({
        where: { id },
        data,
      });
    }),

  // Admin: Delete coupon
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.coupon.delete({
        where: { id: input.id },
      });
    }),
});
