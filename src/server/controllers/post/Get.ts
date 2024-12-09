import { Request, Response } from "express";
import PostModel from "../../models/post/app";

const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, sort = "createdAt", order = "desc" } = req.query;

    const decodedSearch = search ? decodeURIComponent(search as string) : "";

    const searchWithSpaces = decodedSearch.replace(/\+/g, " ");

    const normalizedSearch = searchWithSpaces
      ? searchWithSpaces.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      : "";

    // Define a direção da ordenação
    const sortOrder = order === "desc" ? -1 : 1;

    // Construção da query de busca com regex para filtragem
    const query = normalizedSearch
      ? {
          $or: [
            { subject: { $regex: normalizedSearch, $options: "i" } }, // Filtra pelo assunto
            { questionTitle: { $regex: normalizedSearch, $options: "i" } }, // Filtra pelo título da pergunta
            { questionDescription: { $regex: normalizedSearch, $options: "i" } }, // Filtra pela descrição da pergunta
            { "answers.answerDescription": { $regex: normalizedSearch, $options: "i" } }, // Filtra pela descrição das respostas
            { "answers.answerTitle": { $regex: normalizedSearch, $options: "i" } }, // Filtra pelo título das respostas
          ],
        }
      : {};

    // Consulta ao banco com ordenação apenas
    const posts = await PostModel.find(query).sort({ [sort as string]: sortOrder });

    if (!posts.length) {
      res.status(404).json({ error: "Nenhum post encontrado." });
      return;
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Erro interno do servidor. Tente novamente mais tarde." });
  }
};

export { getPosts };

// import { Request, Response } from "express";
// import PostModel from "../../models/post/app";

// const getPosts = async (req: Request, res: Response): Promise<void> => {
//   try {
//     // Recupera todos os posts do banco de dados
//     const posts = await PostModel.find();

//     if (!posts.length) {
//       res.status(404).json({ error: "Nenhum post encontrado." });
//       return;
//     }

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Erro interno do servidor. Tente novamente mais tarde." });
//   }
// };

// export { getPosts };

// import { Request, Response } from "express";
// import PostModel from "../../models/post/app";

// const getPosts = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { search, sort = "createdAt", order = "desc" } = req.query;

//     // Define a direção da ordenação
//     const sortOrder = order === "desc" ? -1 : 1;

//     // Construção da query de busca com regex para filtragem
//     const query = search
//       ? {
//           $or: [
//             { subject: { $regex: search, $options: "i" } }, // Filtra pelo assunto
//             { questionTitle: { $regex: search, $options: "i" } }, // Filtra pelo título da pergunta
//             { questionDescription: { $regex: search, $options: "i" } }, // Filtra pela descrição da pergunta
//             { "answers.answerDescription": { $regex: search, $options: "i" } }, // Filtra pela descrição das respostas
//             { "answers.answerTitle": { $regex: search, $options: "i" } }, // Filtra pelo título das respostas
//           ],
//         }
//       : {};

//     // Consulta ao banco com ordenação apenas (sem paginação)
//     const posts = await PostModel.find(query).sort({ [sort as string]: sortOrder });

//     if (!posts.length) {
//       res.status(404).json({ error: "Nenhum post encontrado." });
//       return;
//     }

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Erro interno do servidor. Tente novamente mais tarde." });
//   }
// };

// export { getPosts };
