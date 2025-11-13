import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const reviewRouter = createTRPCRouter({
  // Get reviews by hotel
  getByHotel: publicProcedure
    .input(
      z.object({
        hotelId: z.string(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const reviews = await ctx.db.review.findMany({
        where: {
          hotelId: input.hotelId,
          isApproved: true,
        },
        skip,
        take: input.limit,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.review.count({
        where: {
          hotelId: input.hotelId,
          isApproved: true,
        },
      });

      return {
        reviews,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Create review
  create: protectedProcedure
    .input(
      z.object({
        hotelId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has stayed at this hotel
      const booking = await ctx.db.booking.findFirst({
        where: {
          userId: ctx.session.user.id,
          hotelId: input.hotelId,
          status: "COMPLETED",
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only review hotels you've stayed at",
        });
      }

      // Check if user has already reviewed this hotel
      const existingReview = await ctx.db.review.findUnique({
        where: {
          userId_hotelId: {
            userId: ctx.session.user.id,
            hotelId: input.hotelId,
          },
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already reviewed this hotel",
        });
      }

      // Create review
      const review = await ctx.db.review.create({
        data: {
          userId: ctx.session.user.id,
          hotelId: input.hotelId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      // Update hotel rating
      const allReviews = await ctx.db.review.findMany({
        where: {
          hotelId: input.hotelId,
          isApproved: true,
        },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await ctx.db.hotel.update({
        where: { id: input.hotelId },
        data: {
          rating: avgRating,
          totalReviews: allReviews.length,
        },
      });

      return review;
    }),

  // Admin: Get all reviews (including unapproved)
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        approved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where: any = {};
      if (input.approved !== undefined) {
        where.isApproved = input.approved;
      }

      const reviews = await ctx.db.review.findMany({
        where,
        skip,
        take: input.limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          hotel: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.review.count({ where });

      return {
        reviews,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Admin: Approve review
  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.update({
        where: { id: input.id },
        data: { isApproved: true },
      });

      // Recalculate hotel rating
      const allReviews = await ctx.db.review.findMany({
        where: {
          hotelId: review.hotelId,
          isApproved: true,
        },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await ctx.db.hotel.update({
        where: { id: review.hotelId },
        data: {
          rating: avgRating,
          totalReviews: allReviews.length,
        },
      });

      return review;
    }),

  // Admin: Reject review (added for compatibility)
  reject: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.review.update({
        where: { id: input.id },
        data: { isApproved: false },
      });
    }),

  // Admin: Delete review
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.delete({
        where: { id: input.id },
      });

      // Recalculate hotel rating
      const allReviews = await ctx.db.review.findMany({
        where: {
          hotelId: review.hotelId,
          isApproved: true,
        },
      });

      if (allReviews.length > 0) {
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await ctx.db.hotel.update({
          where: { id: review.hotelId },
          data: {
            rating: avgRating,
            totalReviews: allReviews.length,
          },
        });
      } else {
        await ctx.db.hotel.update({
          where: { id: review.hotelId },
          data: {
            rating: 0,
            totalReviews: 0,
          },
        });
      }

      return review;
    }),
});
