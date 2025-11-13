import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Middleware to ensure user is a hotel owner
const hotelOwnerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "HOTEL_OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only hotel owners can access this resource",
    });
  }
  return next();
});

export const hotelOwnerRouter = createTRPCRouter({
  // Get hotel owner's hotel
  getMyHotel: hotelOwnerProcedure.query(async ({ ctx }) => {
    const hotel = await ctx.db.hotel.findUnique({
      where: { ownerId: ctx.session.user.id },
      include: {
        roomCategories: {
          include: {
            prices: {
              orderBy: {
                guestCount: 'asc',
              },
            },
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!hotel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No hotel found for this owner",
      });
    }

    return hotel;
  }),

  // Update hotel information
  updateMyHotel: hotelOwnerProcedure
    .input(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        images: z.array(z.string()).optional(),
        facilities: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const hotel = await ctx.db.hotel.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No hotel found for this owner",
        });
      }

      return ctx.db.hotel.update({
        where: { id: hotel.id },
        data: input,
      });
    }),

  // Create room category
  createRoomCategory: hotelOwnerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        images: z.array(z.string()).optional().default([]),
        maxGuests: z.number().min(1),
        totalRooms: z.number().min(1).default(1),
        amenities: z.array(z.string()).optional().default([]),
        prices: z.array(
          z.object({
            guestCount: z.number().min(1),
            price: z.number().min(0),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get hotel owner's hotel
      const hotel = await ctx.db.hotel.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No hotel found for this owner",
        });
      }

      const { prices, ...categoryData } = input;

      // Create room category with prices
      const roomCategory = await ctx.db.roomCategory.create({
        data: {
          ...categoryData,
          hotelId: hotel.id,
          availableRooms: input.totalRooms,
          prices: {
            create: prices.map(p => ({
              guestCount: p.guestCount,
              price: p.price,
            })),
          },
        },
        include: {
          prices: {
            orderBy: {
              guestCount: 'asc',
            },
          },
        },
      });

      return roomCategory;
    }),

  // Update room category
  updateRoomCategory: hotelOwnerProcedure
    .input(
      z.object({
        roomCategoryId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        maxGuests: z.number().min(1).optional(),
        totalRooms: z.number().min(1).optional(),
        amenities: z.array(z.string()).optional(),
        prices: z.array(
          z.object({
            guestCount: z.number().min(1),
            price: z.number().min(0),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { roomCategoryId, prices, ...updateData } = input;

      // Verify room category belongs to owner's hotel
      const roomCategory = await ctx.db.roomCategory.findUnique({
        where: { id: roomCategoryId },
        include: {
          hotel: true,
        },
      });

      if (!roomCategory || roomCategory.hotel.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this room category",
        });
      }

      // Update room category
      await ctx.db.roomCategory.update({
        where: { id: roomCategoryId },
        data: updateData,
      });

      // Update prices if provided
      if (prices && prices.length > 0) {
        // Delete existing prices
        await ctx.db.price.deleteMany({
          where: { roomCategoryId },
        });

        // Create new prices
        await ctx.db.price.createMany({
          data: prices.map(p => ({
            roomCategoryId,
            guestCount: p.guestCount,
            price: p.price,
          })),
        });
      }

      // Fetch updated room category with prices
      const updatedCategory = await ctx.db.roomCategory.findUnique({
        where: { id: roomCategoryId },
        include: {
          prices: {
            orderBy: {
              guestCount: 'asc',
            },
          },
        },
      });

      return updatedCategory;
    }),

  // Delete room category
  deleteRoomCategory: hotelOwnerProcedure
    .input(z.object({ roomCategoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify room category belongs to owner's hotel
      const roomCategory = await ctx.db.roomCategory.findUnique({
        where: { id: input.roomCategoryId },
        include: {
          hotel: true,
        },
      });

      if (!roomCategory || roomCategory.hotel.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this room category",
        });
      }

      return ctx.db.roomCategory.delete({
        where: { id: input.roomCategoryId },
      });
    }),

  // Get bookings for owner's hotel
  getMyBookings: hotelOwnerProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const hotel = await ctx.db.hotel.findUnique({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No hotel found for this owner",
        });
      }

      const skip = (input.page - 1) * input.limit;

      const where: any = { hotelId: hotel.id };
      if (input.status) {
        where.status = input.status;
      }

      const [bookings, total] = await Promise.all([
        ctx.db.booking.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            roomCategory: {
              select: {
                name: true,
              },
            },
            payment: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        ctx.db.booking.count({ where }),
      ]);

      return {
        bookings,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Get dashboard stats for owner
  getDashboardStats: hotelOwnerProcedure.query(async ({ ctx }) => {
    const hotel = await ctx.db.hotel.findUnique({
      where: { ownerId: ctx.session.user.id },
    });

    if (!hotel) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No hotel found for this owner",
      });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      activeBookings,
      totalRevenue,
      revenueThisMonth,
      totalRooms,
      avgRating,
      recentBookings,
    ] = await Promise.all([
      ctx.db.booking.count({
        where: { hotelId: hotel.id },
      }),
      ctx.db.booking.count({
        where: {
          hotelId: hotel.id,
          status: "CONFIRMED",
        },
      }),
      ctx.db.payment.aggregate({
        where: {
          status: "COMPLETED",
          booking: {
            hotelId: hotel.id,
          },
        },
        _sum: { amount: true },
      }),
      ctx.db.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: firstDayOfMonth },
          booking: {
            hotelId: hotel.id,
          },
        },
        _sum: { amount: true },
      }),
      ctx.db.roomCategory.aggregate({
        where: { hotelId: hotel.id },
        _sum: { totalRooms: true },
      }),
      ctx.db.review.aggregate({
        where: { hotelId: hotel.id },
        _avg: { rating: true },
      }),
      ctx.db.booking.findMany({
        where: { hotelId: hotel.id },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          roomCategory: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      totalBookings,
      activeBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      totalRooms: totalRooms._sum.totalRooms ?? 0,
      avgRating: avgRating._avg.rating ?? 0,
      recentBookings,
    };
  }),
});
