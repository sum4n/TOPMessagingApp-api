import userRouter from "../routes/userRouter.js";

import request from "supertest";
import { prisma } from "../lib/prisma.js";
import express from "express";
const app = express();

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
