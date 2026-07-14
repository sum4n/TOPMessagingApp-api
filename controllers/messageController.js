import { prisma } from "../lib/prisma.js";
import { body, validationResult, matchedData } from "express-validator";
import { AppError } from "../utils/AppError.js";

const validateMessageContent = [
  body("messageContent")
    .trim()
    .notEmpty()
    .withMessage("Message can not be empty")
    .isLength({ max: 4096 })
    .withMessage("Message can not exceed 4096 characters"),
];

async function getUserMessages(req, res) {
  const userId = req.user.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });

  // console.log(messages);

  res.status(200).json({
    messages,
  });
}

const createUserMessage = [
  validateMessageContent,
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { messageContent } = matchedData(req);
    const senderId = parseInt(req.user.id);
    const receiverId = parseInt(req.params.receiverId);

    // check if receiver exists in the database
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      return res.status(404).json("Receiver not found");
    }

    const message = await prisma.message.create({
      data: {
        content: messageContent,
        senderId: senderId,
        receiverId: receiverId,
      },
    });

    res.status(201).json({ message });
  },
];

async function getConversation(req, res) {
  const otherUserId = parseInt(req.params.otherUserId);
  const loggedInUserId = req.user.id;

  const otherUser = await prisma.user.findUnique({
    where: {
      id: otherUserId,
    },
  });

  if (!otherUser) {
    throw new AppError("User not found", 404);
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: loggedInUserId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: loggedInUserId,
        },
      ],
    },
    orderBy: { createdAT: "desc" },
  });

  res.status(200).json({ messages });
}

export { getUserMessages, createUserMessage, getConversation };
