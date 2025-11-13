import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const chatRouter = createTRPCRouter({
  // Get user's chats
  getMyChats: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.chat.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        messages: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
        admin: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),

  // Get single chat with all messages
  getChatById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      // Check if user has access to this chat
      const isAdmin = ctx.session.user.role === "ADMIN";
      const isOwner = chat.userId === ctx.session.user.id;
      const isChatAdmin = chat.adminId === ctx.session.user.id;

      if (!isAdmin && !isOwner && !isChatAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      return chat;
    }),

  // Create new chat
  createChat: protectedProcedure
    .input(
      z.object({
        subject: z.string().optional(),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create chat
      const chat = await ctx.db.chat.create({
        data: {
          userId: ctx.session.user.id,
          subject: input.subject,
        },
      });

      // Create first message
      await ctx.db.message.create({
        data: {
          chatId: chat.id,
          senderId: ctx.session.user.id,
          content: input.message,
        },
      });

      return chat;
    }),

  // Send message
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify chat exists and user has access
      const chat = await ctx.db.chat.findUnique({
        where: { id: input.chatId },
      });

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found",
        });
      }

      const isAdmin = ctx.session.user.role === "ADMIN";
      const isOwner = chat.userId === ctx.session.user.id;
      const isChatAdmin = chat.adminId === ctx.session.user.id;

      if (!isAdmin && !isOwner && !isChatAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this chat",
        });
      }

      // Create message
      const message = await ctx.db.message.create({
        data: {
          chatId: input.chatId,
          senderId: ctx.session.user.id,
          content: input.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
            },
          },
        },
      });

      // Update chat's updatedAt
      await ctx.db.chat.update({
        where: { id: input.chatId },
        data: { updatedAt: new Date() },
      });

      return message;
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.message.updateMany({
        where: {
          chatId: input.chatId,
          senderId: { not: ctx.session.user.id },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return { success: true };
    }),

  // Admin: Get all chats
  getAllChats: adminProcedure
    .input(
      z.object({
        status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]).optional(),
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

      const chats = await ctx.db.chat.findMany({
        where,
        skip,
        take: input.limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      const total = await ctx.db.chat.count({ where });

      return {
        chats,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Admin: Assign chat to admin
  assignToMe: adminProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.update({
        where: { id: input.chatId },
        data: {
          adminId: ctx.session.user.id,
          status: "IN_PROGRESS",
        },
      });
    }),

  // Admin: Close chat
  closeChat: adminProcedure
    .input(z.object({ chatId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.update({
        where: { id: input.chatId },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.message.count({
      where: {
        chat: {
          userId: ctx.session.user.id,
        },
        senderId: { not: ctx.session.user.id },
        isRead: false,
      },
    });

    return count;
  }),
});
