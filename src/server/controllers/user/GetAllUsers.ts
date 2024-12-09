import { Request, Response } from "express";
import UserModel from "../../models/user/app";

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.find({}, "-password"); // Exclui a senha do retorno
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar usuários." });
  }
};
