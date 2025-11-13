import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const hotelRouter = createTRPCRouter({
  // Get all hotels with pagination and filters
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        limit: z.number().min(1).max(50).optional(),
        skip: z.number().min(0).optional(),
        take: z.number().min(1).max(50).optional(),
        city: z.string().optional(),
        search: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        facilities: z.array(z.string()).optional(),
        amenities: z.array(z.string()).optional(),
        sortBy: z.enum(["price", "rating", "distance"]).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }).optional().default({})
    )
    .query(async ({ ctx, input }) => {
      // Support both page/limit and skip/take pagination
      const limit = input.take || input.limit || 10;
      const skip = input.skip !== undefined 
        ? input.skip 
        : input.page 
          ? (input.page - 1) * limit 
          : 0;

      const where: any = {};

      if (input.city) {
        where.city = {
          contains: input.city,
          mode: "insensitive",
        };
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { address: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Support both amenities (old) and facilities (new)
      const facilitiesFilter = input.amenities || input.facilities;
      if (facilitiesFilter && facilitiesFilter.length > 0) {
        where.facilities = {
          hasSome: facilitiesFilter,
        };
      }

      const hotels = await ctx.db.hotel.findMany({
        where,
        skip,
        take: limit,
        include: {
          roomCategories: {
            include: {
              prices: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              bookings: true,
              roomCategories: true,
            },
          },
        },
      });

      // Calculate distance if lat/lng provided
      let hotelsWithDistance: any[] = hotels;
      if (input.latitude && input.longitude) {
        hotelsWithDistance = hotels.map((hotel: any) => ({
          ...hotel,
          distance: calculateDistance(
            input.latitude!,
            input.longitude!,
            hotel.latitude,
            hotel.longitude
          ),
        }));

        if (input.sortBy === "distance") {
          hotelsWithDistance.sort((a: any, b: any) => a.distance - b.distance);
        }
      }

      // Sort by price or rating
      if (input.sortBy === "price") {
        hotelsWithDistance.sort((a: any, b: any) => {
          const aMinPrice = Math.min(
            ...a.roomCategories.flatMap((cat: any) =>
              cat.prices.map((p: any) => p.price)
            )
          );
          const bMinPrice = Math.min(
            ...b.roomCategories.flatMap((cat: any) =>
              cat.prices.map((p: any) => p.price)
            )
          );
          return aMinPrice - bMinPrice;
        });
      } else if (input.sortBy === "rating") {
        hotelsWithDistance.sort((a: any, b: any) => b.rating - a.rating);
      }

      const total = await ctx.db.hotel.count({ where });

      return {
        hotels: hotelsWithDistance,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Get hotel by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.hotel.findUnique({
        where: { id: input.id },
        include: {
          roomCategories: {
            include: {
              prices: {
                orderBy: {
                  guestCount: "asc",
                },
              },
            },
          },
          reviews: {
            where: {
              isApproved: true,
            },
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
          },
        },
      });
    }),

  // Get nearest hotels
  getNearby: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().default(10), // km
        limit: z.number().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const hotels = await ctx.db.hotel.findMany({
        include: {
          roomCategories: {
            include: {
              prices: true,
            },
          },
        },
      });

      const hotelsWithDistance = hotels
        .map((hotel: any) => ({
          ...hotel,
          distance: calculateDistance(
            input.latitude,
            input.longitude,
            hotel.latitude,
            hotel.longitude
          ),
        }))
        .filter((hotel: any) => hotel.distance <= input.radius)
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, input.limit);

      return hotelsWithDistance;
    }),

  // Admin: Create hotel
  create: adminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        address: z.string(),
        city: z.string(),
        country: z.string().default("Bangladesh"),
        latitude: z.number(),
        longitude: z.number(),
        images: z.array(z.string()).default([]),
        facilities: z.array(z.string()).default([]),
        amenities: z.array(z.string()).optional(),
        ownerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use facilities or amenities (amenities is old name)
      const facilitiesArray = input.amenities || input.facilities;
      
      // Generate random password for hotel owner
      const ownerPassword = generateRandomPassword();

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
          facilities: facilitiesArray,
          ownerId: input.ownerId,
          ownerPassword: await hashPassword(ownerPassword),
        },
      });

      // TODO: Send email to owner with credentials

      return {
        hotel,
        credentials: {
          hotelId: hotel.id,
          password: ownerPassword,
        },
      };
    }),

  // Admin: Update hotel
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        images: z.array(z.string()).optional(),
        facilities: z.array(z.string()).optional(),
        amenities: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amenities, ...data } = input;
      
      // Use amenities if provided (old name)
      if (amenities) {
        data.facilities = amenities;
      }
      
      return ctx.db.hotel.update({
        where: { id },
        data,
      });
    }),

  // Admin: Delete hotel
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.hotel.delete({
        where: { id: input.id },
      });
    }),

  // Hotel Owner: Get my hotel
  getMyHotel: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "HOTEL_OWNER") {
      throw new Error("Only hotel owners can access this");
    }

    return ctx.db.hotel.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: {
        roomCategories: {
          include: {
            prices: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });
  }),

  // Hotel Owner: Get owner stats
  getOwnerStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "HOTEL_OWNER") {
      throw new Error("Only hotel owners can access this");
    }

    const hotel = await ctx.db.hotel.findFirst({
      where: { ownerId: ctx.session.user.id },
    });

    if (!hotel) {
      return null;
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      thisMonthBookings,
      totalRevenue,
      thisMonthRevenue,
      totalRoomCategories,
    ] = await Promise.all([
      ctx.db.booking.count({
        where: { hotelId: hotel.id },
      }),
      ctx.db.booking.count({
        where: {
          hotelId: hotel.id,
          createdAt: { gte: firstDayOfMonth },
        },
      }),
      ctx.db.payment.aggregate({
        where: {
          status: "COMPLETED",
          booking: { hotelId: hotel.id },
        },
        _sum: { amount: true },
      }),
      ctx.db.payment.aggregate({
        where: {
          status: "COMPLETED",
          booking: {
            hotelId: hotel.id,
            createdAt: { gte: firstDayOfMonth },
          },
        },
        _sum: { amount: true },
      }),
      ctx.db.roomCategory.count({
        where: { hotelId: hotel.id },
      }),
    ]);

    return {
      totalBookings,
      thisMonthBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      thisMonthRevenue: thisMonthRevenue._sum.amount ?? 0,
      totalRoomCategories,
      availableRooms: totalRoomCategories, // Number of room categories
    };
  }),

  // Hotel Owner: Get occupancy rate
  getOccupancyRate: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "HOTEL_OWNER") {
      throw new Error("Only hotel owners can access this");
    }

    const hotel = await ctx.db.hotel.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: {
        roomCategories: {
          include: {
            bookings: {
              where: {
                status: "CONFIRMED",
                checkIn: { lte: new Date() },
                checkOut: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    if (!hotel) {
      return null;
    }

    // Calculate total rooms across all categories
    const totalRooms = hotel.roomCategories.reduce(
      (sum, category) => sum + category.totalRooms,
      0
    );

    // Calculate occupied rooms (current bookings)
    const occupiedRooms = hotel.roomCategories.reduce(
      (sum, category) => {
        // Count bookings, but don't exceed total rooms in category
        const categoryOccupied = Math.min(
          category.bookings.length,
          category.totalRooms
        );
        return sum + categoryOccupied;
      },
      0
    );

    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 
      ? Math.round((occupiedRooms / totalRooms) * 100)
      : 0;

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate,
    };
  }),

  // Hotel Owner: Get monthly revenue trend
  getMonthlyRevenue: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(12).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "HOTEL_OWNER") {
        throw new Error("Only hotel owners can access this");
      }

      const hotel = await ctx.db.hotel.findFirst({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        return [];
      }

      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(now.getMonth() - input.months);

      const payments = await ctx.db.payment.findMany({
        where: {
          status: "COMPLETED",
          booking: { hotelId: hotel.id },
          createdAt: { gte: startDate },
        },
        include: {
          booking: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by month
      const revenueByMonth: Record<string, number> = {};
      
      payments.forEach((payment) => {
        const monthKey = payment.createdAt.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + payment.amount;
      });

      return Object.entries(revenueByMonth).map(([month, amount]) => ({
        month,
        amount,
      }));
    }),

  // Hotel Owner: Update my hotel
  updateMyHotel: protectedProcedure
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
      if (ctx.session.user.role !== "HOTEL_OWNER") {
        throw new Error("Only hotel owners can access this");
      }

      const hotel = await ctx.db.hotel.findFirst({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        throw new Error("Hotel not found");
      }

      return ctx.db.hotel.update({
        where: { id: hotel.id },
        data: input,
      });
    }),
});

// Helper functions
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function generateRandomPassword(): string {
  return Math.random().toString(36).slice(-8);
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}
