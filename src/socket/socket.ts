import { Server } from 'socket.io';

import * as config from './config.js';
import {
    enterRoom,
    createRoom,
    leaveRoom,
    handleDisconnect,
    gameStart,
    changeProgress,
    changeStatus,
    gameOverHandler
} from '../helpers/sockt.helpers.js';
import { getAllRooms } from '../helpers/room.helpers.js';

export default (io: Server) => {
    io.on('connection', socket => {
        socket.emit('GET_ROOMS', getAllRooms());

        socket.on('JOIN_ROOM', (roomName: string) => {
            enterRoom(io, socket, roomName);
        });

        socket.on('CREATE_ROOM', (roomName: string) => {
            createRoom(io, socket, roomName);
        });

        socket.on('LEAVE_ROOM', () => {
            leaveRoom(io, socket);
        });

        socket.on('disconnect', () => {
            handleDisconnect(io, socket);
        });

        socket.on('CHANGE_READY_STATUS', () => {
            changeStatus(io, socket);
        });

        socket.on('GAME_START', currentRoom => {
            gameStart(io, currentRoom);
        });

        socket.on('CHANGE_PROGRESS', (progress: number) => {
            changeProgress(io, socket, progress);
        });

        socket.on('GAME_OVER', () => {
            gameOverHandler(io, socket);
        });
    });
};
