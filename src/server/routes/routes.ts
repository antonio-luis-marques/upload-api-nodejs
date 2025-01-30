import { Router } from "express";
import { PostController, UserController } from "../controllers/app";
// "start": "nodemon ./src/app.ts"
// "start": "node ./build/api/index.js"
const router = Router()

router.post('/post', PostController.uploadMiddleware, PostController.create);

router.get('/posts', PostController.getPosts);
router.get('/post/:id', PostController.getPostById);

router.post('/create/user', UserController.uploadMiddleware, UserController.createUser)
router.get('/users', UserController.getAllUsers)

router.get('/user/:id', UserController.getUserById)

export {router}