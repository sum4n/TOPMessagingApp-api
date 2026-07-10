import { prisma } from "../lib/prisma.js";

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

export { getUserMessages };
