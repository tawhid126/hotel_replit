import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  hotelOwnerProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import {
  availabilityEmitter,
  AVAILABILITY_EVENTS,
  type AvailabilityUpdate,
} from "~/server/events/availability";

export const roomCategoryRouter = createTRPCRouter({
  // Get room categories by hotel
  getByHotel: protectedProcedure
    .input(z.object({ hotelId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.roomCategory.findMany({
        where: { hotelId: input.hotelId },
        include: {
          prices: {
            orderBy: {
              guestCount: "asc",
            },
          },
        },
      });
    }),

  // Hotel Owner: Create room category
  create: hotelOwnerProcedure
    .input(
      z.object({
        hotelId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        images: z.array(z.string()),
        maxGuests: z.number().min(1),
        totalRooms: z.number().min(1).default(1),
        amenities: z.array(z.string()),
        prices: z.array(
          z.object({
            guestCount: z.number().min(1),
            pricePerNight: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user owns this hotel
      const hotel = await ctx.db.hotel.findUnique({
        where: { id: input.hotelId },
      });

      if (!hotel || hotel.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add categories to your own hotel",
        });
      }

      const { prices, ...categoryData } = input;

      const roomCategory = await ctx.db.roomCategory.create({
        data: {
          ...categoryData,
          prices: {
            create: prices.map(p => ({ guestCount: p.guestCount, price: p.pricePerNight })),
          },
        },
        include: {
          prices: true,
        },
      });

      return roomCategory;
    }),

  // Hotel Owner: Update room category
  update: hotelOwnerProcedure
    .input(
      z.object({
        id: z.string(),
        hotelId: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        maxGuests: z.number().min(1).optional(),
        totalRooms: z.number().min(1).optional(),
        amenities: z.array(z.string()).optional(),
        prices: z
          .array(
            z.object({
              guestCount: z.number().min(1),
              pricePerNight: z.number().min(0),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, prices, ...data } = input;

      // Verify ownership
      const category = await ctx.db.roomCategory.findUnique({
        where: { id },
        include: { hotel: true },
      });

      if (!category || category.hotel.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own room categories",
        });
      }

      // Update room category
      const updated = await ctx.db.roomCategory.update({
        where: { id },
        data,
      });

      // If prices are provided, update them
      if (prices) {
        // Delete existing prices
        await ctx.db.price.deleteMany({
          where: { roomCategoryId: id },
        });

        // Create new prices
        await ctx.db.price.createMany({
          data: prices.map((p) => ({
            guestCount: p.guestCount,
            price: p.pricePerNight,
            roomCategoryId: id,
          })),
        });
      }

      return ctx.db.roomCategory.findUnique({
        where: { id },
        include: { prices: true },
      });
    }),

  // Hotel Owner: Update pricing
  updatePricing: hotelOwnerProcedure
    .input(
      z.object({
        roomCategoryId: z.string(),
        prices: z.array(
          z.object({
            guestCount: z.number().min(1),
            price: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const category = await ctx.db.roomCategory.findUnique({
        where: { id: input.roomCategoryId },
        include: { hotel: true },
      });

      if (!category || category.hotel.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update pricing for your own room categories",
        });
      }

      // Delete existing prices
      await ctx.db.price.deleteMany({
        where: { roomCategoryId: input.roomCategoryId },
      });

      // Create new prices
      await ctx.db.price.createMany({
        data: input.prices.map((p) => ({
          ...p,
          roomCategoryId: input.roomCategoryId,
        })),
      });

      return ctx.db.roomCategory.findUnique({
        where: { id: input.roomCategoryId },
        include: { prices: true },
      });
    }),

  // Hotel Owner/Admin: Delete room category
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.roomCategory.findUnique({
        where: { id: input.id },
        include: { hotel: true },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room category not found",
        });
      }

      // Check if user owns this hotel or is admin
      if (
        category.hotel.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this category",
        });
      }

      return ctx.db.roomCategory.delete({
        where: { id: input.id },
      });
    }),

  // Real-time subscription for availability changes
  onAvailabilityChange: publicProcedure
    .input(
      z.object({
        roomCategoryId: z.string().optional(),
        hotelId: z.string().optional(),
      })
    )
    .subscription(({ input }) => {
      return observable<AvailabilityUpdate>((emit) => {
        const onUpdate = (data: AvailabilityUpdate) => {
          // Filter by roomCategoryId or hotelId if provided
          if (input.roomCategoryId && data.roomCategoryId !== input.roomCategoryId) {
            return;
          }
          if (input.hotelId && data.hotelId !== input.hotelId) {
            return;
          }

          emit.next(data);
        };

        // Listen to all availability events
        availabilityEmitter.on(AVAILABILITY_EVENTS.ROOM_UPDATED, onUpdate);
        availabilityEmitter.on(AVAILABILITY_EVENTS.BOOKING_CREATED, onUpdate);
        availabilityEmitter.on(AVAILABILITY_EVENTS.BOOKING_CANCELLED, onUpdate);

        // Cleanup on unsubscribe
        return () => {
          availabilityEmitter.off(AVAILABILITY_EVENTS.ROOM_UPDATED, onUpdate);
          availabilityEmitter.off(AVAILABILITY_EVENTS.BOOKING_CREATED, onUpdate);
          availabilityEmitter.off(AVAILABILITY_EVENTS.BOOKING_CANCELLED, onUpdate);
        };
      });
    }),
});
