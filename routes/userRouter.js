import { Router } from "express";
import {
  getAllUsers,
  createUser,
  loginUser,
  getUserProfile,
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

export default userRouter;
