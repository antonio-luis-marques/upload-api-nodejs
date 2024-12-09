import { Request, Response } from "express";
import UserModel from "../../models/user/app";

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
  
      if (!id) {
        res.status(400).json({ message: "ID do usuário é obrigatório." });
        return;
      }
  
      const user = await UserModel.findById(id, "-password"); // Exclui a senha do retorno
  
      if (!user) {
        res.status(404).json({ message: "Usuário não encontrado." });
        return;
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar usuário." });
    }
  };
  