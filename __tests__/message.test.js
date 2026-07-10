import messageRouter from "../routes/messageRouter.js";

import request from "supertest";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import express from "express";
import passport from "passport";
import jwtStrategy from "../strategies/jwt.js";
import { generateToken } from "../utils/jwt.js";

const app = express();
app.use(express.json());
passport.use(jwtStrategy);

app.use("/messages", messageRouter);

afterAll(async () => {
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /messages", () => {
  afterEach(async () => {
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

  const createUser = async (name, email) => {
    return prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash("test-password", 10),
      },
    });
  };

  it("throws 401 error if jwt token is missing", async () => {
    const res = await request(app)
      .get("/messages")
      .set("Authorization", "Bearer");

    expect(res.status).toBe(401);
  });

  it("throws 401 error is jwt token is invalid", async () => {
    const res = await request(app)
      .get("/messages")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });

  it("fetches messages with valid jwt token", async () => {
    const user1 = await createUser("test1", "test1@test.com");
    const user2 = await createUser("test2", "test2@test.com");

    const token = generateToken(user1);

    const messages = await prisma.message.createManyAndReturn({
      data: [
        {
          content: "message 1",
          senderId: user1.id,
          receiverId: user2.id,
        },
        {
          content: "message 2",
          senderId: user2.id,
          receiverId: user1.id,
        },
      ],
    });

    // console.log(messages);

    const res = await request(app)
      .get("/messages")
      .set("Authorization", `Bearer ${token}`);

    // console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
  });

  it("fetches empty message array if no messages are found", async () => {
    const user = await createUser("test", "test@test.com");

    // console.log(users);

    const token = generateToken(user);

    const res = await request(app)
      .get("/messages")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(0);
  });
});
