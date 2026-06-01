import express from "express";
import passport from "passport";
import jwtStrategy from "./strategies/jwt.js";
import userRouter from "./routes/userRouter.js";

const app = express();

app.use(express.json());

passport.use(jwtStrategy);

app.use("/users", userRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`App running on port: ${PORT}`);
});
