import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';

import socketHandler from './socket/socket.js';
import routes from './routes/routes.js';
import { STATIC_PATH, PORT } from './config.js';
import { clients } from './data.js';

const app = express();
const httpServer = new http.Server(app);
const socketIo = new Server(httpServer);

app.use(express.static(STATIC_PATH));

routes(app);

app.get('*', (req, res) => res.redirect('/login'));

socketIo.use((socket, next) => {
    const username = socket.handshake.query.username as string;
    if (!username) {
        next(new Error(`Username must be provided!`));
    }

    socket.on('disconnect', () => {
        const index = clients.findIndex(client => client.username === username);
        clients.splice(index, 1);
    });

    const isClientWithNameExist = clients.find(client => client.username === username);

    if (isClientWithNameExist) {
        next(new Error(`User with name ${username} already connected`));
    } else {
        clients.push({ id: socket.id, username });
        console.log(clients);
        next();
    }
});

socketHandler(socketIo);

httpServer.listen(PORT, () => {
    console.log(`- Listen server on port ${PORT}`);
    console.log(`- App running on http://localhost:${PORT}`);
});

export default { app, httpServer };
