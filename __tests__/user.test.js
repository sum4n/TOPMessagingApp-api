import userRouter from "../routes/userRouter.js";

import request from "supertest";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import express from "express";
const app = express();

app.use(express.json());

app.use("/users", userRouter);

beforeEach(async () => {
  const users = await prisma.user.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@prisma.io",
        password: "alice",
      },
      {
        name: "Bob",
        email: "bob@prisma.io",
        password: "bob",
      },
    ],
  });
});

afterEach(async () => {
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /users", () => {
  it("returns two users", async () => {
    const res = await request(app)
      .get("/users")
      .set("Accept", "application/json");

    // console.log(res.body);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.status).toBe(200);
    expect(res.body.allUsers).toHaveLength(2);
  });
});

describe("POST /users/sign-up", () => {
  it("creates an user with encrypted password", async () => {
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: `john@prisma.io`, password: "john" })
      .set("Accept", "application/json");

    const match = await bcrypt.compare("john", res.body.password);
    // console.log(res.body);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.password).not.toEqual("john");
    expect(match).toBe(true);
  });
});
