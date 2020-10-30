import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Error } from "mongoose";
import User, { IUser } from "../db/models/user";

export interface IUserAuthRequest extends Request {
  user: IUser;
  token: string | undefined;
}

const auth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = jwt.verify(token as string, process.env.JWT_SECRET as string) as { _id: string };
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

    if (!user) {
      throw new Error("");
    }

    (req as IUserAuthRequest).user = user;
    (req as IUserAuthRequest).token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate!" });
  }
};

export default auth;
