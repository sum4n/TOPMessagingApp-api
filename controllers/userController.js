import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { body, validationResult, matchedData } from "express-validator";

const validateRegister = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email can not be empty")
    .isEmail()
    .withMessage("Must use valid email format"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password can not be empty")
    .isLength({ min: 8 })
    .withMessage("Minimum password length is 8"),
];

async function getAllUsers(req, res) {
  const allUsers = await prisma.user.findMany({
    include: {
      sendMessages: true,
      receivedMessages: true,
    },
  });

  res.json({ allUsers });
}

const createUser = [
  validateRegister,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = matchedData(req);
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
        },
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          // This error format matches validation error format
          errors: [
            {
              path: "email",
              msg: "Email already exists",
            },
          ],
        });
      }

      throw error;
    }
  },
];

export { getAllUsers, createUser };
