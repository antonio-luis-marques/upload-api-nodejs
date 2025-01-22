"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const app_1 = require("../controllers/app");
// "start": "nodemon ./src/app.ts"
const router = (0, express_1.Router)();
exports.router = router;
router.post('/post', app_1.PostController.uploadMiddleware, app_1.PostController.create);
router.get('/posts', app_1.PostController.getPosts);
router.get('/post/:id', app_1.PostController.getPostById);
router.post('/create/user', app_1.UserController.uploadMiddleware, app_1.UserController.createUser);
router.get('/users', app_1.UserController.getAllUsers);
router.get('/user/:id', app_1.UserController.getUserById);
