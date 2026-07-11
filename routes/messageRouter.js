import { Router } from "express";
import {
  getUserMessages,
  createUserMessage,
} from "../controllers/messageController.js";
import passport from "passport";

const messageRouter = Router();

messageRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getUserMessages,
);

messageRouter.post(
  "/:receiverId",
  passport.authenticate("jwt", { session: false }),
  createUserMessage,
);

export default messageRouter;
