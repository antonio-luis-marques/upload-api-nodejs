import express from 'express';
import cors from 'cors'; // Importe o pacote cors
import { router } from './routes/routes';
import connectDB from './database/mongoose/app';
import 'dotenv/config';
import { testCloudinaryConnection } from './database/cloudinary/app';

const server = express();
connectDB();
testCloudinaryConnection()

server.use(cors({
  origin: 'http://localhost:3000', // Permitir requisições desta origem
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
}));

server.use(express.json());
server.use(router);

export { server };
