import { Router } from "express";
import { PostController, UserController } from "../controllers/app";

const router = Router()

router.post('/post', PostController.uploadMiddleware, PostController.create);

router.get('/posts', PostController.getPosts);
router.get('/post/:id', PostController.getPostById);
router.put('/add-solution/:id', PostController.uploadMiddlewareUpdate, PostController.addAnswer);

router.post('/create/user', UserController.uploadMiddleware, UserController.createUser)
router.get('/users', UserController.getAllUsers)
router.get('/user/:id', UserController.getUserById)



export {router}