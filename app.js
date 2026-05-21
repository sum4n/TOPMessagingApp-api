import express from "express";
const app = express();
import userRouter from "./routes/userRouter.js";

app.use("/users", userRouter);

const PORT = 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`App running on port: ${PORT}`);
});
