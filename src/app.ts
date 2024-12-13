import { server } from "./server/Server";


const port = parseInt(process.env.PORT || '3000', 10); // Define 3000 como padrão se PORT não for definido
server.listen(port, '0.0.0.0', () => {
    console.log('Hello World: ', port);
});