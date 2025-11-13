import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { emitBookingCreated, emitBookingCancelled } from "~/server/events/availability";
import { sendBookingConfirmationSMS, sendBookingCancellationSMS } from "~/lib/sms";

export const bookingRouter = createTRPCRouter({
  // Create booking
  create: protectedProcedure
    .input(
      z.object({
        hotelId: z.string(),
        roomCategoryId: z.string(),
        checkIn: z.date(),
        checkOut: z.date(),
        guestCount: z.number().min(1),
        specialRequests: z.string().optional(),
        couponCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check room availability
      const roomCategory = await ctx.db.roomCategory.findUnique({
        where: { id: input.roomCategoryId },
        include: {
          prices: true,
        },
      });

      if (!roomCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room category not found",
        });
      }

      // Check if rooms are available
      if (roomCategory.availableRooms <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rooms available for this category",
        });
      }

      // Check for date conflicts - prevent double booking
      const conflictingBookings = await ctx.db.booking.count({
        where: {
          roomCategoryId: input.roomCategoryId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          OR: [
            // New booking starts during existing booking
            {
              AND: [
                { checkIn: { lte: input.checkIn } },
                { checkOut: { gt: input.checkIn } },
              ],
            },
            // New booking ends during existing booking
            {
              AND: [
                { checkIn: { lt: input.checkOut } },
                { checkOut: { gte: input.checkOut } },
              ],
            },
            // New booking completely contains existing booking
            {
              AND: [
                { checkIn: { gte: input.checkIn } },
                { checkOut: { lte: input.checkOut } },
              ],
            },
          ],
        },
      });

      // Check if there are enough rooms available for the selected dates
      const bookedRooms = conflictingBookings;
      const availableRoomsForDates = roomCategory.totalRooms - bookedRooms;

      if (availableRoomsForDates <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rooms available for the selected dates. Please choose different dates.",
        });
      }

      if (input.guestCount > roomCategory.maxGuests) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Maximum ${roomCategory.maxGuests} guests allowed`,
        });
      }

      // Get price for guest count
      const priceInfo = roomCategory.prices.find(
        (p) => p.guestCount === input.guestCount
      );

      if (!priceInfo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No price found for ${input.guestCount} guests`,
        });
      }

      // Calculate total price
      const nights = Math.ceil(
        (input.checkOut.getTime() - input.checkIn.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      let totalPrice = priceInfo.price * nights;

      // Apply coupon if provided
      if (input.couponCode) {
        const coupon = await ctx.db.coupon.findUnique({
          where: { code: input.couponCode },
        });

        if (
          coupon &&
          coupon.isActive &&
          coupon.validFrom <= new Date() &&
          coupon.validTo >= new Date() &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          (!coupon.minAmount || totalPrice >= coupon.minAmount)
        ) {
          const discount = coupon.isPercentage
            ? (totalPrice * coupon.discount) / 100
            : coupon.discount;

          const finalDiscount = coupon.maxDiscount
            ? Math.min(discount, coupon.maxDiscount)
            : discount;

          totalPrice -= finalDiscount;

          // Update coupon usage
          await ctx.db.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      // Create booking
      const booking = await ctx.db.booking.create({
        data: {
          userId: ctx.session.user.id,
          hotelId: input.hotelId,
          roomCategoryId: input.roomCategoryId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: input.guestCount,
          totalPrice,
          specialRequests: input.specialRequests,
        },
        include: {
          hotel: true,
          roomCategory: true,
          user: true,
        },
      });

      // Decrease available rooms count
      const updatedRoomCategory = await ctx.db.roomCategory.update({
        where: { id: input.roomCategoryId },
        data: {
          availableRooms: {
            decrement: 1,
          },
        },
      });

      // Emit real-time event for availability update
      emitBookingCreated({
        roomCategoryId: booking.roomCategoryId,
        hotelId: booking.hotelId,
        availableRooms: updatedRoomCategory.availableRooms,
        totalRooms: updatedRoomCategory.totalRooms,
        timestamp: Date.now(),
      });

      // Send SMS confirmation if user has phone number
      if (booking.user.phone) {
        sendBookingConfirmationSMS(
          booking.user.phone,
          booking.user.name || "Guest",
          booking.hotel.name,
          booking.id,
          booking.checkIn,
          booking.checkOut,
          booking.totalPrice,
          booking.user.smsEnabled
        ).catch((err) => console.error("Failed to send SMS:", err));
      }

      return booking;
    }),

  // Get user bookings
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.booking.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        hotel: true,
        roomCategory: true,
        payment: true,
        invoice: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  // Get booking by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        include: {
          hotel: true,
          roomCategory: true,
          payment: true,
          invoice: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      // Check if user owns this booking or is admin
      if (
        booking.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this booking",
        });
      }

      return booking;
    }),

  // Cancel booking
  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.id },
        include: {
          payment: true,
          hotel: true,
          user: true,
        },
      });

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      if (booking.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only cancel your own bookings",
        });
      }

      if (booking.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is already cancelled",
        });
      }

      // Calculate refund amount (if applicable)
      let refundAmount = 0;
      if (booking.payment && booking.payment.status === "COMPLETED") {
        refundAmount = booking.totalPrice;
      }

      // Update booking status
      const updatedBooking = await ctx.db.booking.update({
        where: { id: input.id },
        data: { status: "CANCELLED" },
      });

      // Restore available rooms count
      const updatedRoomCategory = await ctx.db.roomCategory.update({
        where: { id: booking.roomCategoryId },
        data: {
          availableRooms: {
            increment: 1,
          },
        },
      });

      // Emit real-time event for availability update
      emitBookingCancelled({
        roomCategoryId: booking.roomCategoryId,
        hotelId: booking.hotelId,
        availableRooms: updatedRoomCategory.availableRooms,
        totalRooms: updatedRoomCategory.totalRooms,
        timestamp: Date.now(),
      });

      // If payment was completed, initiate refund
      if (booking.payment && booking.payment.status === "COMPLETED") {
        await ctx.db.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });

        // TODO: Initiate actual refund through payment gateway
      }

      // Send cancellation SMS
      if (booking.user.phone) {
        sendBookingCancellationSMS(
          booking.user.phone,
          booking.user.name || "Guest",
          booking.hotel.name,
          booking.id,
          refundAmount > 0 ? refundAmount : undefined
        ).catch((err) => console.error("Failed to send SMS:", err));
      }

      return updatedBooking;
    }),

  // Admin: Get all bookings
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where: any = {};
      if (input.status) {
        where.status = input.status;
      }

      const bookings = await ctx.db.booking.findMany({
        where,
        skip,
        take: input.limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          hotel: true,
          roomCategory: true,
          payment: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.booking.count({ where });

      return {
        bookings,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Hotel Owner: Get my hotel bookings
  getMyHotelBookings: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "HOTEL_OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only hotel owners can access this",
        });
      }

      // Find owner's hotel
      const hotel = await ctx.db.hotel.findFirst({
        where: { ownerId: ctx.session.user.id },
      });

      if (!hotel) {
        return {
          bookings: [],
          total: 0,
          pages: 0,
        };
      }

      const skip = (input.page - 1) * input.limit;

      const where: any = {
        hotelId: hotel.id,
      };

      if (input.status) {
        where.status = input.status;
      }

      const bookings = await ctx.db.booking.findMany({
        where,
        skip,
        take: input.limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
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
          createdAt: "desc",
        },
      });

      const total = await ctx.db.booking.count({ where });

      return {
        bookings,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Get booked dates for a room category (for calendar)
  getBookedDates: protectedProcedure
    .input(
      z.object({
        roomCategoryId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = input.startDate || new Date();
      const endDate = input.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

      const bookings = await ctx.db.booking.findMany({
        where: {
          roomCategoryId: input.roomCategoryId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          OR: [
            {
              AND: [
                { checkIn: { lte: endDate } },
                { checkOut: { gte: startDate } },
              ],
            },
          ],
        },
        select: {
          checkIn: true,
          checkOut: true,
        },
      });

      return bookings.map((booking) => ({
        start: booking.checkIn,
        end: booking.checkOut,
      }));
    }),

  // Check availability for specific dates
  checkAvailability: protectedProcedure
    .input(
      z.object({
        roomCategoryId: z.string(),
        checkIn: z.date(),
        checkOut: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const roomCategory = await ctx.db.roomCategory.findUnique({
        where: { id: input.roomCategoryId },
      });

      if (!roomCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Room category not found",
        });
      }

      // Count overlapping bookings
      const conflictingBookings = await ctx.db.booking.count({
        where: {
          roomCategoryId: input.roomCategoryId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          OR: [
            {
              AND: [
                { checkIn: { lte: input.checkIn } },
                { checkOut: { gt: input.checkIn } },
              ],
            },
            {
              AND: [
                { checkIn: { lt: input.checkOut } },
                { checkOut: { gte: input.checkOut } },
              ],
            },
            {
              AND: [
                { checkIn: { gte: input.checkIn } },
                { checkOut: { lte: input.checkOut } },
              ],
            },
          ],
        },
      });

      const availableRooms = roomCategory.totalRooms - conflictingBookings;

      return {
        available: availableRooms > 0,
        availableRooms,
        totalRooms: roomCategory.totalRooms,
        bookedRooms: conflictingBookings,
      };
    }),
});
