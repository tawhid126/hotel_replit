import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const supportRouter = createTRPCRouter({
  // ===== CONTACT FORM =====

  // Submit contact request (public)
  submitContact: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().min(3),
        message: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const contactRequest = await ctx.db.contactRequest.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          subject: input.subject,
          message: input.message,
        },
      });

      return {
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
        id: contactRequest.id,
      };
    }),

  // Admin: Get all contact requests
  getAllContacts: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where: any = {};
      if (input.status) {
        where.status = input.status;
      }

      const contacts = await ctx.db.contactRequest.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await ctx.db.contactRequest.count({ where });

      return {
        contacts,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Admin: Update contact status
  updateContactStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
        response: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contactRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          response: input.response,
        },
      });
    }),

  // Admin: Delete contact request
  deleteContact: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.contactRequest.delete({
        where: { id: input.id },
      });
    }),

  // ===== FAQ =====

  // Get all active FAQs (public)
  getFAQs: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = { isActive: true };

      if (input.category) {
        where.category = input.category;
      }

      if (input.search) {
        where.OR = [
          { question: { contains: input.search, mode: "insensitive" } },
          { answer: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const faqs = await ctx.db.fAQ.findMany({
        where,
        orderBy: [
          { category: "asc" },
          { order: "asc" },
        ],
      });

      return faqs;
    }),

  // Get FAQ categories
  getFAQCategories: publicProcedure.query(async ({ ctx }) => {
    const faqs = await ctx.db.fAQ.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return faqs.map((faq) => faq.category);
  }),

  // Admin: Get all FAQs (including inactive)
  getAllFAQs: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.fAQ.findMany({
      orderBy: [
        { category: "asc" },
        { order: "asc" },
      ],
    });
  }),

  // Admin: Create FAQ
  createFAQ: adminProcedure
    .input(
      z.object({
        question: z.string().min(5),
        answer: z.string().min(10),
        category: z.string().min(2),
        order: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fAQ.create({
        data: {
          question: input.question,
          answer: input.answer,
          category: input.category,
          order: input.order,
          isActive: input.isActive,
        },
      });
    }),

  // Admin: Update FAQ
  updateFAQ: adminProcedure
    .input(
      z.object({
        id: z.string(),
        question: z.string().min(5).optional(),
        answer: z.string().min(10).optional(),
        category: z.string().min(2).optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.fAQ.update({
        where: { id },
        data,
      });
    }),

  // Admin: Delete FAQ
  deleteFAQ: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fAQ.delete({
        where: { id: input.id },
      });
    }),

  // ===== CHATBOT =====

  // Get chatbot response (simple keyword matching)
  getChatbotResponse: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(async ({ ctx, input }) => {
      const message = input.message.toLowerCase();

      // Keyword-based responses
      if (message.includes("book") || message.includes("reservation")) {
        return {
          response: "To book a hotel, browse our hotels on the homepage, select your desired hotel, choose a room category, select dates and number of guests, and complete the booking process. You'll need to sign in to make a booking.",
          suggestions: ["How to cancel booking?", "Payment methods", "View my bookings"],
        };
      }

      if (message.includes("cancel") || message.includes("refund")) {
        return {
          response: "You can cancel your booking from your profile page. Go to 'My Bookings', find your booking, and click the 'Cancel Booking' button. Refund policies depend on the hotel and booking terms.",
          suggestions: ["Contact support", "View cancellation policy", "My bookings"],
        };
      }

      if (message.includes("payment") || message.includes("pay") || message.includes("bkash") || message.includes("nagad")) {
        return {
          response: "We accept Bkash, Nagad, and Bank Transfer payments. After confirming your booking, you'll be directed to select a payment method and complete the payment process. All transactions are secure.",
          suggestions: ["Booking help", "Refund policy", "Payment failed"],
        };
      }

      if (message.includes("login") || message.includes("sign in") || message.includes("account")) {
        return {
          response: "You can sign in using your email and password, or use Google Sign-In for quick access. If you don't have an account, click 'Sign Up' to create one.",
          suggestions: ["Forgot password", "Create account", "Google sign in"],
        };
      }

      if (message.includes("review") || message.includes("rating")) {
        return {
          response: "You can leave a review after completing a stay at a hotel. Go to the hotel's page and click 'Write Review' to rate and share your experience. All reviews are moderated by our admin team.",
          suggestions: ["How to book", "View hotels", "My bookings"],
        };
      }

      if (message.includes("contact") || message.includes("support") || message.includes("help")) {
        return {
          response: "You can contact us through:\n• Email: support@hotelbooking.com\n• Phone: +880 1234-567890 (24/7)\n• Or use our contact form to send us a message.",
          suggestions: ["Contact form", "Live chat", "FAQ"],
        };
      }

      if (message.includes("price") || message.includes("cost") || message.includes("cheap")) {
        return {
          response: "Hotel prices vary based on room category, number of guests, and dates. You can see all pricing details on each hotel's page. We also offer special discounts and coupons from time to time.",
          suggestions: ["View hotels", "Special offers", "Compare prices"],
        };
      }

      // Default response
      return {
        response: "I'm here to help! I can assist you with bookings, cancellations, payments, account questions, and more. You can also browse our FAQ section or contact our support team directly.",
        suggestions: [
          "How to book a hotel?",
          "Payment methods",
          "Cancel booking",
          "Contact support",
          "View FAQ",
        ],
      };
    }),
});
