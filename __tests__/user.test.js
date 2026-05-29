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
  it("throws error if email is empty", async () => {
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: "", password: "pas" })
      .set("Accept", "application/json");

    // console.log(res.body.errors);
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
          msg: "Email can not be empty",
        }),
      ]),
    );
  });

  it("throws error if email format is wrong", async () => {
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: "badformatemial.com", password: "password" })
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
          msg: "Must use valid email format",
        }),
      ]),
    );
  });

  it("throws error if password is empty", async () => {
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: "good@email.com", password: "" })
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "password",
          msg: "Password can not be empty",
        }),
      ]),
    );
  });

  it("throws error if password is less than 8 characters length", async () => {
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: "good@email.com", password: "seven" })
      .set("Accept", "application/json");

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "password",
          msg: "Minimum password length is 8",
        }),
      ]),
    );
  });

  it("creates an user with encrypted password when valid email and password is given", async () => {
    const validEmail = "valid@email.com";
    const validPassword = "validpassword";

    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: validEmail, password: validPassword })
      .set("Accept", "application/json");

    const user = await prisma.user.findFirst({
      where: {
        email: validEmail,
      },
    });
    // console.log(user);
    // console.log(res.body);

    const match = await bcrypt.compare(validPassword, user.password);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.password).not.toEqual(validPassword);
    expect(match).toBe(true);
  });

  it("throws error if duplicate email is used", async () => {
    const duplicateEmail = "alice@prisma.io";
    const res = await request(app)
      .post("/users/sign-up")
      .send({ email: duplicateEmail, password: "validpassword" });

    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
          msg: "Email already exists",
        }),
      ]),
    );
  });
});

describe("POST /users/log-in", () => {
  it("throws error if empty email is given", async () => {
    const res = await request(app)
      .post("/users/log-in")
      .send({ email: "", password: "validpassword" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
          msg: "Email can not be empty",
        }),
      ]),
    );
  });

  it("throws error if wrong email format is given", async () => {
    const res = await request(app)
      .post("/users/log-in")
      .send({ email: "bademail.com", password: "validpassword" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "email",
          msg: "Must use valid email format",
        }),
      ]),
    );
  });

  it("throws error is empty password is given", async () => {
    const res = await request(app)
      .post("/users/log-in")
      .send({ email: "good@email.com", password: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "password",
          msg: "Password can not be empty",
        }),
      ]),
    );
  });
});
