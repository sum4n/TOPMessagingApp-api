import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  const secret = process.env.SECRET_KEY;
  const opts = { expiresIn: "7d" };
  return jwt.sign({ userId: user.id }, secret, opts);
};
