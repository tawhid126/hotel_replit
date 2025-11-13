import { z } from "zod";
import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .regex(
            /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain uppercase, lowercase and number"
          ),
        phone: z
          .string()
          .min(10, "Phone number is required")
          .regex(
            /^(\+?880)?1[3-9]\d{8}$/,
            "Please enter a valid phone number"
          )
          .transform(val => val.replace(/[\s-]/g, '')), // Clean phone number
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, email, password, phone } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already exists. Please sign in instead.",
        });
      }

      // Hash password
      const hashedPassword = await hash(password, 10);

      // Create user
      try {
        const user = await ctx.db.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone,
            role: "CUSTOMER", // Default role
            emailVerified: new Date(), // Auto-verify for now
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        return {
          success: true,
          user,
          message: "Account created successfully",
        };
      } catch (error) {
        console.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }
    }),

  // Check if email exists (for real-time validation)
  checkEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
        select: { id: true },
      });

      return {
        exists: !!user,
      };
    }),
});
