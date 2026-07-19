import { Router } from "express";
import {
  getAllUsers,
  createUser,
  loginUser,
  getUserProfile,
  getUserListOrderedByMessages,
} from "../controllers/userController.js";
import passport from "passport";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.post("/sign-up", createUser);
userRouter.post("/log-in", loginUser);
userRouter.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  getUserProfile,
);
userRouter.get(
  "/chats",
  passport.authenticate("jwt", { session: false }),
  getUserListOrderedByMessages,
);

export default userRouter;
