import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

async function getAllUsers(req, res) {
  const allUsers = await prisma.user.findMany({
    include: {
      sendMessages: true,
      receivedMessages: true,
    },
  });

  res.json({ allUsers });
}

async function createUser(req, res, next) {
  const email = req.body.email;
  const password = await bcrypt.hash(req.body.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email: email,
        password: password,
      },
    });
    res.json(user);
  } catch (err) {
    return next(err);
  }
}

export { getAllUsers, createUser };
