import { Router } from "express";
import { getUserMessages } from "../controllers/messageController.js";
import passport from "passport";

const messageRouter = Router();

messageRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getUserMessages,
);

export default messageRouter;
