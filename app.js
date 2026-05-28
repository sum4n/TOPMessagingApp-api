import express from "express";
const app = express();
import userRouter from "./routes/userRouter.js";

app.use(express.json());

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
