import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
} from "~/server/api/trpc";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  // Get dashboard statistics
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      activeBookings,
      totalRevenue,
      revenueThisMonth,
      totalUsers,
      newUsersThisMonth,
      totalHotels,
      activeHotels,
      recentBookings,
      pendingReviews,
    ] = await Promise.all([
      ctx.db.booking.count(),
      ctx.db.booking.count({
        where: { status: "CONFIRMED" },
      }),
      ctx.db.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      ctx.db.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: firstDayOfMonth },
        },
        _sum: { amount: true },
      }),
      ctx.db.user.count(),
      ctx.db.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      ctx.db.hotel.count(),
      ctx.db.hotel.count(),
      ctx.db.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          roomCategory: {
            include: {
              hotel: { select: { name: true } },
            },
          },
        },
      }),
      ctx.db.review.findMany({
        where: { isApproved: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          hotel: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalBookings,
      activeBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      totalUsers,
      newUsersThisMonth,
      totalHotels,
      activeHotels,
      recentBookings,
      pendingReviews,
    };
  }),

  // Get revenue analytics
  getRevenueAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      const payments = await ctx.db.payment.findMany({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by date
      const revenueByDate = payments.reduce((acc: any, payment: any) => {
        const date = payment.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + payment.amount;
        return acc;
      }, {});

      return Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount,
      }));
    }),

  // Get booking analytics
  getBookingAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      const bookings = await ctx.db.booking.findMany({
        where: {
          createdAt: { gte: startDate },
        },
      });

      const bookingsByStatus = bookings.reduce((acc: any, booking: any) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});

      return bookingsByStatus;
    }),

  // Get payment method distribution
  getPaymentMethodStats: adminProcedure.query(async ({ ctx }) => {
    const payments = await ctx.db.payment.findMany({
      where: { status: "COMPLETED" },
    });

    const methodStats = payments.reduce((acc: any, payment: any) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1;
      return acc;
    }, {});

    return methodStats;
  }),

  // Get top hotels by bookings and revenue
  getTopHotels: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const hotels = await ctx.db.hotel.findMany({
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
          bookings: {
            include: {
              payment: {
                where: {
                  status: "COMPLETED",
                },
              },
            },
          },
        },
        take: 100, // Get more initially to calculate revenue
      });

      // Calculate total revenue for each hotel
      const hotelsWithRevenue = hotels.map((hotel) => {
        const totalRevenue = hotel.bookings.reduce((sum, booking) => {
          return sum + (booking.payment?.amount || 0);
        }, 0);

        return {
          id: hotel.id,
          name: hotel.name,
          bookingsCount: hotel._count.bookings,
          totalRevenue,
        };
      });

      // Sort by revenue (descending) and take top N
      const topHotels = hotelsWithRevenue
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, input.limit);

      return topHotels;
    }),

  // Get top room categories by bookings
  getTopRoomCategories: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const roomCategories = await ctx.db.roomCategory.findMany({
        include: {
          _count: {
            select: {
              bookings: true,
            },
          },
          hotel: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          bookings: {
            _count: "desc",
          },
        },
        take: input.limit,
      });

      return roomCategories.map((category) => ({
        id: category.id,
        name: category.name,
        hotelName: category.hotel.name,
        bookingsCount: category._count.bookings,
      }));
    }),

  // Get all users
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        role: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where: any = {};
      if (input.role) {
        where.role = input.role;
      }

      const users = await ctx.db.user.findMany({
        where,
        skip,
        take: input.limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.user.count({ where });

      return {
        users,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Update user role
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["ADMIN", "HOTEL_OWNER", "CUSTOMER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  // Create new user
  createUser: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        phone: z.string().optional(),
        role: z.enum(["ADMIN", "HOTEL_OWNER", "CUSTOMER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash(input.password, 10);

      return ctx.db.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          phone: input.phone,
          role: input.role,
        },
      });
    }),

  // Delete user
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.delete({
        where: { id: input.userId },
      });
    }),

  // Create hotel with automatic owner account creation
  createHotel: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        country: z.string().min(1).default("Bangladesh"),
        latitude: z.number(),
        longitude: z.number(),
        images: z.array(z.string()).optional().default([]),
        facilities: z.array(z.string()).optional().default([]),
        ownerName: z.string().min(1),
        ownerEmail: z.string().email(),
        ownerPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if email already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.ownerEmail },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This email is already registered. Please use a different email.",
        });
      }

      // Generate secure random password for hotel owner
      const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      const ownerPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(ownerPassword, 10);

      // Create hotel owner account
      const owner = await ctx.db.user.create({
        data: {
          name: input.ownerName,
          email: input.ownerEmail,
          phone: input.ownerPhone,
          password: hashedPassword,
          role: "HOTEL_OWNER",
        },
      });

      // Generate unique hotel password (for hotel-specific access if needed)
      const hotelPassword = generatePassword();
      const hashedHotelPassword = await bcrypt.hash(hotelPassword, 10);

      // Create hotel and link to owner
      const hotel = await ctx.db.hotel.create({
        data: {
          name: input.name,
          description: input.description,
          address: input.address,
          city: input.city,
          country: input.country,
          latitude: input.latitude,
          longitude: input.longitude,
          images: input.images,
          facilities: input.facilities,
          ownerId: owner.id,
          ownerPassword: hashedHotelPassword,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Return hotel info along with owner credentials
      return {
        hotel,
        ownerCredentials: {
          email: input.ownerEmail,
          password: ownerPassword, // Return plain password only this once
          message: "⚠️ IMPORTANT: Save these credentials! They will not be shown again.",
        },
      };
    }),

  // Update hotel
  updateHotel: adminProcedure
    .input(
      z.object({
        hotelId: z.string(),
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
      const { hotelId, ...updateData } = input;

      return ctx.db.hotel.update({
        where: { id: hotelId },
        data: updateData,
      });
    }),

  // Delete hotel
  deleteHotel: adminProcedure
    .input(z.object({ hotelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // This will also delete the owner's account (cascade)
      return ctx.db.hotel.delete({
        where: { id: input.hotelId },
      });
    }),

  // Get all hotels (for admin management)
  getAllHotels: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where: any = {};
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [hotels, total] = await Promise.all([
        ctx.db.hotel.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            _count: {
              select: {
                roomCategories: true,
                bookings: true,
                reviews: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.hotel.count({ where }),
      ]);

      return {
        hotels,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Create room category with dynamic pricing
  createRoomCategory: adminProcedure
    .input(
      z.object({
        hotelId: z.string(),
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
      const { prices, ...categoryData } = input;

      // Create room category with prices
      const roomCategory = await ctx.db.roomCategory.create({
        data: {
          ...categoryData,
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

  // Update room category with dynamic pricing
  updateRoomCategory: adminProcedure
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

      // Update room category
      const roomCategory = await ctx.db.roomCategory.update({
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
  deleteRoomCategory: adminProcedure
    .input(z.object({ roomCategoryId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.roomCategory.delete({
        where: { id: input.roomCategoryId },
      });
    }),

  // Get room categories for a hotel
  getRoomCategories: adminProcedure
    .input(z.object({ hotelId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.roomCategory.findMany({
        where: { hotelId: input.hotelId },
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
        orderBy: {
          createdAt: 'asc',
        },
      });
    }),
});
