import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtém todos os posts do banco de dados
    const posts = await PostModel.find();

    // Retorna os posts no formato JSON
    res.status(200).json({
      msg: "Posts recuperados com sucesso!",
      data: posts,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
    } else {
      res.status(500).json({ msg: "Erro desconhecido no servidor" });
    }
  }
};

export { getSubject };
