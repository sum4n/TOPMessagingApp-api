import userRouter from "../routes/userRouter.js";

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

app.use("/users", userRouter);

// beforeEach(async () => {
//   const users = await prisma.user.createMany({
//     data: [
//       {
//         name: "Alice",
//         email: "alice@prisma.io",
//         password: "alicepassword",
//       },
//       {
//         name: "Bob",
//         email: "bob@prisma.io",
//         password: "bobpassword",
//       },
//     ],
//   });
// });

// afterEach(async () => {
//   await prisma.user.deleteMany();
// });

afterAll(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe("GET /users", () => {
  beforeAll(async () => {
    const users = await prisma.user.createMany({
      data: [
        {
          name: "Alice",
          email: "alice@prisma.io",
          password: await bcrypt.hash("alicePassword", 10),
        },
        {
          name: "Bob",
          email: "bob@prisma.io",
          password: await bcrypt.hash("bobPassword", 10),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

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
  afterAll(async () => {
    await prisma.user.deleteMany();
  });

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

    await prisma.user.create({
      data: {
        name: "Alice",
        email: duplicateEmail,
        password: await bcrypt.hash("alicePassword", 10),
      },
    });

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
  const email = "new@email.com";
  const password = "bcryptHash";

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, password: hashedPassword },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

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

  it("throws error if email does not exist in database", async () => {
    const res = await request(app)
      .post("/users/log-in")
      .send({ email: "notfound@email.com", password: "password" });

    // console.log(res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual("Invalid email or password");
  });

  it("throws error if wrong password is used", async () => {
    const res = await request(app)
      .post("/users/log-in")
      .send({ email, password: "wrongPassword" });

    // console.log(res.body);
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual("Invalid email or password");
  });

  it("returns jwt token when vaild credentials are provided", async () => {
    const email = "new@email.com";

    const res = await request(app)
      .post("/users/log-in")
      .send({ email, password });

    // console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: "Auth passed",
      token: expect.any(String),
    });
  });
});

describe("GET /users/profile", () => {
  let token;
  beforeAll(async () => {
    user = await prisma.user.create({
      data: {
        name: "profile",
        email: "profile@gmail.com",
        password: await bcrypt.hash("profilePassword", 10),
      },
    });

    token = generateToken(user);
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it("user can access protected /profile route with valid token", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", `Bearer ${token}`);

    // console.log(res.body);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "profile@gmail.com",
      name: "profile",
    });
  });

  it("thorws 401 error when accessing route without token", async () => {
    const res = await request(app).get("/users/profile");

    // console.log(res.status);
    expect(res.status).toBe(401);
    expect(res.text).toBe("Unauthorized");
  });

  it("throws 401 error when accessing route with invalid token", async () => {
    const res = await request(app)
      .get("/users/profile")
      .set("Authorization", "Bearer invalid-token");

    // console.log(res.status, res.text);
    expect(res.status).toBe(401);
    expect(res.text).toBe("Unauthorized");
  });
});
