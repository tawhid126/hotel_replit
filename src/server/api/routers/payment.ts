import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { sendInvoiceEmail, generateAndUploadInvoicePDF } from "~/lib/email";
import { sendPaymentSuccessSMS } from "~/lib/sms";

export const paymentRouter = createTRPCRouter({
  // Create payment
  create: protectedProcedure
    .input(
      z.object({
        bookingId: z.string(),
        method: z.enum(["BKASH", "NAGAD", "BANK"]),
        couponCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findUnique({
        where: { id: input.bookingId },
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
          message: "You can only pay for your own bookings",
        });
      }

      // Calculate final amount (apply discount if coupon provided)
      let finalAmount = booking.totalPrice;
      let appliedCouponCode: string | null = null;

      if (input.couponCode) {
        const coupon = await ctx.db.coupon.findUnique({
          where: { code: input.couponCode },
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          if (now >= coupon.validFrom && now <= coupon.validTo) {
            // Check if coupon has usage limit and is not exceeded
            if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
              // Apply discount
              if (coupon.isPercentage) {
                const discount = (booking.totalPrice * coupon.discount) / 100;
                // Apply max discount if specified
                const actualDiscount = coupon.maxDiscount 
                  ? Math.min(discount, coupon.maxDiscount) 
                  : discount;
                finalAmount = booking.totalPrice - actualDiscount;
              } else {
                finalAmount = booking.totalPrice - coupon.discount;
              }

              // Ensure final amount is not negative
              finalAmount = Math.max(finalAmount, 0);
              appliedCouponCode = coupon.code;

              // Update coupon usage count
              await ctx.db.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: coupon.usedCount + 1 },
              });
            }
          }
        }
      }

      const payment = await ctx.db.payment.create({
        data: {
          bookingId: input.bookingId,
          amount: finalAmount,
          method: input.method,
          status: "PENDING",
        },
      });

      // TODO: Integrate with actual payment gateway
      // Return payment gateway URL or token

      return payment;
    }),

  // Update payment status (after payment gateway callback)
  updateStatus: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        status: z.enum(["COMPLETED", "FAILED"]),
        transactionId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findUnique({
        where: { id: input.paymentId },
        include: {
          booking: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      if (payment.booking.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      // Update payment
      const updatedPayment = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: {
          status: input.status,
          transactionId: input.transactionId,
        },
      });

      // Update booking status if payment completed
      if (input.status === "COMPLETED") {
        await ctx.db.booking.update({
          where: { id: payment.bookingId },
          data: { status: "CONFIRMED" },
        });

        // Create transaction record
        await ctx.db.transaction.create({
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: "BDT",
            description: `Payment for booking ${payment.bookingId}`,
          },
        });

        // Get booking with details for PDF generation
        const bookingWithDetails = await ctx.db.booking.findUnique({
          where: { id: payment.bookingId },
          include: {
            user: true,
            hotel: true,
            roomCategory: true,
          },
        });

        // Generate PDF and upload to Firebase Storage
        let pdfUrl: string | undefined;
        if (bookingWithDetails) {
          try {
            pdfUrl = await generateAndUploadInvoicePDF(
              bookingWithDetails,
              updatedPayment,
              bookingWithDetails.user
            );
          } catch (error) {
            console.error("Failed to upload PDF to cloud storage:", error);
          }
        }

        // Create invoice with PDF URL
        const invoice = await ctx.db.invoice.create({
          data: {
            bookingId: payment.bookingId,
            invoiceNumber: `INV-${Date.now()}`,
            amount: payment.amount,
            pdfUrl: pdfUrl,
          },
        });

        // Send invoice email with PDF attachment
        if (bookingWithDetails?.user.email) {
          // Send email asynchronously (don't wait for completion)
          sendInvoiceEmail(
            bookingWithDetails.user.email,
            bookingWithDetails,
            updatedPayment,
            bookingWithDetails.user
          ).catch((error) => {
            console.error("Failed to send invoice email:", error);
          });
        }

        // Send payment success SMS
        if (bookingWithDetails?.user.phone && input.transactionId) {
          sendPaymentSuccessSMS(
            bookingWithDetails.user.phone,
            bookingWithDetails.user.name || "Guest",
            payment.amount,
            input.transactionId,
            payment.bookingId,
            (bookingWithDetails.user as any).smsEnabled ?? true
          ).catch((error) => {
            console.error("Failed to send payment SMS:", error);
          });
        }
      }

      return updatedPayment;
    }),

  // Get payment by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.findUnique({
        where: { id: input.id },
        include: {
          booking: true,
          transaction: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment not found",
        });
      }

      // Check authorization
      if (
        payment.booking.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      return payment;
    }),

  // Get user's payments
  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is requesting their own payments or is admin
      if (input.userId !== ctx.session.user.id && ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own payments",
        });
      }

      const payments = await ctx.db.payment.findMany({
        where: {
          booking: {
            userId: input.userId,
          },
        },
        include: {
          booking: {
            include: {
              hotel: {
                select: {
                  name: true,
                },
              },
              roomCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
          transaction: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return payments;
    }),

  // Admin: Get all payments
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

      const payments = await ctx.db.payment.findMany({
        where,
        skip,
        take: input.limit,
        include: {
          booking: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
              hotel: {
                select: {
                  name: true,
                },
              },
            },
          },
          transaction: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.payment.count({ where });

      return {
        payments,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),
});
