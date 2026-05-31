import { Router } from "express";
import {
  getAllUsers,
  createUser,
  loginUser,
} from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.post("/sign-up", createUser);
userRouter.post("/log-in", loginUser);

export default userRouter;
