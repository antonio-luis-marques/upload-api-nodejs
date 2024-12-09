import mongoose, { Schema } from "mongoose";
import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Obtém o ID dos parâmetros da requisição

    // Valida o ID antes de buscar no banco
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ msg: "ID inválido!" });
      return;
    }

    // Busca o post no banco de dados pelo ID
    const post = await PostModel.findById(id);

    // Verifica se o post foi encontrado
    if (!post) {
      res.status(404).json({
        msg: "Post não encontrado!",
      });
      return;
    }

    // Retorna o post no formato JSON
    res.status(200).json({
      msg: "Post recuperado com sucesso!",
      data: post,
    });
  } catch (error) {
    console.error("Erro ao buscar o post:", error);

    if (error instanceof Error) {
      res.status(500).json({ msg: "Erro interno do servidor", error: error.message });
    } else {
      res.status(500).json({ msg: "Erro desconhecido no servidor" });
    }
  }
};

export { getPostById };
