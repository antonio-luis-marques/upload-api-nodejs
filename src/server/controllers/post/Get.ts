import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sort = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    const allowedSortFields = ["createdAt", "updatedAt", "subject"];
    if (!allowedSortFields.includes(sort as string)) {
      res.status(400).json({ error: "Campo de ordenação inválido." });
      return;
    }

    const allowedOrders = ["asc", "desc"];
    if (!allowedOrders.includes(order as string)) {
      res.status(400).json({ error: "Ordem de ordenação inválida." });
      return;
    }

    const decodedSearch = search ? decodeURIComponent(search as string) : "";
    const searchWithSpaces = decodedSearch.replace(/\+/g, " ");
    const normalizedSearch = searchWithSpaces
      ? searchWithSpaces.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "";

    const sortOrder = order === "desc" ? -1 : 1;

    const query = normalizedSearch
      ? {
          $or: [
            { subject: { $regex: normalizedSearch, $options: "i" } },
            { questionTitle: { $regex: normalizedSearch, $options: "i" } },
            { questionDescription: { $regex: normalizedSearch, $options: "i" } },
            { "answers.answerDescription": { $regex: normalizedSearch, $options: "i" } },
            { "answers.answerTitle": { $regex: normalizedSearch, $options: "i" } },
          ],
        }
      : {};

    const pageInt = parseInt(page as string);
    const maxLimit = 50;
    const limitInt = Math.min(parseInt(limit as string), maxLimit);

    if (pageInt <= 0 || limitInt <= 0) {
      res.status(400).json({ error: "Página ou limite inválidos." });
      return;
    }

    const skip = (pageInt - 1) * limitInt;
    const totalPosts = await PostModel.countDocuments(query);

    const posts = await PostModel.find(query)
      .skip(skip)
      .limit(limitInt)
      .sort({ [sort as string]: sortOrder });
    res.status(200).json({
      posts,
      total: totalPosts,
      page: pageInt,
      limit: limitInt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro interno do servidor.",
      details: error instanceof Error ? error.message : "Erro desconhecido.",
    });
  }
};

export { getPosts };
