import { prisma } from "../lib/prisma.js";

async function getAllUsers(req, res) {
  const allUsers = await prisma.user.findMany({
    include: {
      sendMessages: true,
      receivedMessages: true,
    },
  });

  res.json({ allUsers });
}

export { getAllUsers };
