import { type NextFunction, type Response } from "express";
import { Author } from "../models/Author";
import { verifyToken } from "../utils/token";

export const isAuth = async (req: any, res: Response, next: NextFunction): Promise<null> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No tienes autorización para realizar esta operación" );
    }

    // Descodificamos el token
    const decodedInfo = verifyToken(token);
    const author = await Author.findOne({ email: decodedInfo.authorEmail }).select("+password");
    if (!author) {
      throw new Error("No tienes autorización para realizar esta operación");
    }

    req.author = author;
    next();

    return null;
  } catch (error) {
    res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    return null;
  }
};

module.exports = { isAuth };
