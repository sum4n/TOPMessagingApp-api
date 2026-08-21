import express from "express";
import passport from "passport";
import jwtStrategy from "./strategies/jwt.js";
import userRouter from "./routes/userRouter.js";
import messageRouter from "./routes/messageRouter.js";
import cors from "cors";

const app = express();

app.use(express.json());

passport.use(jwtStrategy);

const corsOptions = cors({
  origin: process.env.originURL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsOptions);

app.use("/users", userRouter);
app.use("/messages", messageRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`App running on port: ${PORT}`);
});
