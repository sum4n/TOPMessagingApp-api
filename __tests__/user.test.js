import userRouter from "../routes/userRouter.js";

import request from "supertest";
import express from "express";
const app = express();

app.use("/user", userRouter);

test("user router works", (done) => {
  request(app).get("/user").expect(200, done);
});
