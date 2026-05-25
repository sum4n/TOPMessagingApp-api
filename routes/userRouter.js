import { Router } from "express";
import { getAllUsers, createUser } from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.post("/sign-up", createUser);

export default userRouter;
