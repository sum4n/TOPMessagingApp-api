import { Strategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import { prisma } from "../lib/prisma.js";

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

const jwtStrategy = new Strategy(opts, async (jwt_payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: jwt_payload.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        joinedAt: true,
      },
    });
    // console.log(user);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (err) {
    // console.log(err);
    return done(err);
  }
});

export default jwtStrategy;
