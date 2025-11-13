import { createTRPCRouter } from "~/server/api/trpc";
import { hotelRouter } from "~/server/api/routers/hotel";
import { bookingRouter } from "~/server/api/routers/booking";
import { paymentRouter } from "~/server/api/routers/payment";
import { reviewRouter } from "~/server/api/routers/review";
import { userRouter } from "~/server/api/routers/user";
import { roomCategoryRouter } from "~/server/api/routers/roomCategory";
import { couponRouter } from "~/server/api/routers/coupon";
import { adminRouter } from "~/server/api/routers/admin";
import { hotelOwnerRouter } from "~/server/api/routers/hotel-owner";
import { chatRouter } from "~/server/api/routers/chat";
import { supportRouter } from "~/server/api/routers/support";
import { authRouter } from "~/server/api/routers/auth";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  hotel: hotelRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  review: reviewRouter,
  user: userRouter,
  roomCategory: roomCategoryRouter,
  coupon: couponRouter,
  admin: adminRouter,
  hotelOwner: hotelOwnerRouter,
  chat: chatRouter,
  support: supportRouter,
});

export type AppRouter = typeof appRouter;
