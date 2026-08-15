import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { body, validationResult, matchedData } from "express-validator";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

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

const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email can not be empty")
    .isEmail()
    .withMessage("Must use valid email format"),

  body("password").trim().notEmpty().withMessage("Password can not be empty"),
];

const validateName = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name can not be empty")
    .isLength({ min: 2 })
    .withMessage("Minimum name length is 2"),
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

const loginUser = [
  validateLogin,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = matchedData(req);
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    const match = user && (await bcrypt.compare(password, user.password));

    if (!user || !match) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Auth passed",
      token,
    });
  },
];

const getUserProfile = async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
};

const updateUserProfile = [
  validateName,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = matchedData(req);
    const user = req.user;

    try {
      const updatedProfile = await prisma.user.update({
        where: { email: user.email },
        data: { name: name },
      });

      const { password, ...profileWithoutPassword } = updatedProfile;

      res.status(200).json({
        message: "Profile updated",
        profile: profileWithoutPassword,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({
          errors: [
            {
              path: "name",
              msg: "Name already exists",
            },
          ],
        });
      }

      throw error;
    }
  },
];

const getUserListOrderedByMessages = async (req, res) => {
  const usersOrderedByChat = await prisma.$queryRaw`
    WITH chat_list AS (
       SELECT
        MAX("createdAT") AS "lastMessageAt", 
        CASE
          WHEN "senderId" = ${req.user.id} THEN "receiverId"
          ELSE "senderId"
        END AS "chatId"
      FROM "Message"
      WHERE "senderId" = ${req.user.id} OR "receiverId" = ${req.user.id}
      GROUP BY "chatId"
      ORDER BY "lastMessageAt" DESC
    )
    SELECT 
      "chat_list"."chatId",
      "chat_list"."lastMessageAt",
      "User".id AS "userId",
      CASE
        WHEN "User"."name" IS NULL THEN "User"."email"
        ELSE "User"."name"
      END AS "user"
    FROM "User"
    LEFT JOIN "chat_list" ON "User".id = "chat_list"."chatId"
    WHERE "User".id != ${req.user.id} 
     `;

  res.status(200).json({ users: usersOrderedByChat });
};

export {
  getAllUsers,
  createUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserListOrderedByMessages,
};
