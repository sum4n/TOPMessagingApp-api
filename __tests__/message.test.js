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

const createUser = async (name, email) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash("test-password", 10),
    },
  });
};

describe("GET /messages", () => {
  afterEach(async () => {
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
  });

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

describe("POST /messages", () => {
  it("throws 401 error if Authorization header is missing", async () => {
    const res = await request(app).post("/messages/23");

    expect(res.status).toBe(401);
  });

  it("throws 401 error if JWT token is missing", async () => {
    const res = await request(app)
      .post("/messages/23")
      .set("Authorization", "Bearer");

    expect(res.status).toBe(401);
  });

  it("throws 401 error if invalid JWT token is given", async () => {
    const res = await request(app)
      .post("/messages/23")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });

  describe("POST /messages with valid JWT token", () => {
    let token;
    let sender;
    let receiver;
    beforeEach(async () => {
      sender = await createUser("sender", "sender@email.com");
      receiver = await createUser("receiver", "receiver@email.com");
      token = generateToken(sender);
    });

    afterEach(async () => {
      await prisma.message.deleteMany();
      await prisma.user.deleteMany();
    });

    it("creates message in the database with valid JWT token", async () => {
      const res = await request(app)
        .post(`/messages/${receiver.id}`)
        .send({ messageContent: "Hello from sender" })
        .set("Authorization", `Bearer ${token}`);

      const dbMessage = await prisma.message.findFirst({
        where: {
          senderId: sender.id,
          receiverId: receiver.id,
        },
      });

      expect(dbMessage).not.toBeNull();
      expect(dbMessage.content).toBe("Hello from sender");
      // console.log(res.body);
      expect(res.status).toBe(201);
      expect(res.body.message).toEqual(
        expect.objectContaining({
          content: "Hello from sender",
          senderId: sender.id,
          receiverId: receiver.id,
        }),
      );
    });

    it("throws error if empty message is posted", async () => {
      const res = await request(app)
        .post(`/messages/${receiver.id}`)
        .send({ messageContent: "" })
        .set("Authorization", `Bearer ${token}`);

      // console.log(res.body);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: "",
            msg: "Message can not be empty",
            path: "messageContent",
          }),
        ]),
      );
    });

    it("throws error if messageContent field is missing", async () => {
      const res = await request(app)
        .post(`/messages/${receiver.id}`)
        .send({})
        .set("Authorization", `Bearer ${token}`);

      // console.log(res.body);
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: "",
            msg: "Message can not be empty",
            path: "messageContent",
          }),
        ]),
      );
    });
  });
});
