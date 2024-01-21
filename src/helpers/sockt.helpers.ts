import { Server, Socket } from 'socket.io';
import { roomsMapp, texts } from '../data.js';
import { IRoomData, IUserData, IUserDataList } from '../types/client.types.js';
import { addUserToRoom, getRoomUsers, addRoom, getRoomIfExist, getAllRooms, getCurrentRoom, getRoomByUserName, getUserFromRoom } from './room.helpers.js';
import { MAXIMUM_USERS_FOR_ONE_ROOM } from '../socket/config.js';

export const randomArrayIndex = (arr: string[]) => {
    return Math.floor(Math.random() * arr.length);
};

export const getSocketUserName = (socket: Socket) => socket.handshake.query.username as string;

export const isAllUsersReady = (users: IUserDataList) => {
    let ready = true;
    users.forEach(user => {
        if (!user.ready) ready = false;
    });
    return ready;
};

export const enterRoom = (io: Server, socket: Socket, roomName: string) => {
    const username = getSocketUserName(socket);
    const gameRoom = getRoomIfExist(roomName);

    if (gameRoom) {
        const users = getRoomUsers(gameRoom);
        if (users.length >= MAXIMUM_USERS_FOR_ONE_ROOM) {
            const reason = 'This room already has 3 members';
            socket.emit('SHOW_ERROR_MODAL', reason);
            return;
        }

        socket.join(roomName);
        addUserToRoom(roomName, socket.id, username);

        io.emit('UPDATE_ROOM_DETAILS', { roomName, users });
        io.to(socket.id).emit('JOIN_ROOM_DONE', gameRoom);
        io.to(roomName).emit('SET_USERS_IN_ROOM', users);
    }
};

export const createRoom = (io: Server, socket: Socket, roomName: string) => {
    if (roomsMapp.has(roomName)) {
        const reason = 'Room wiht this name alreasy exist';
        socket.emit('SHOW_ERROR_MODAL', reason);
        return;
    }
    const username = getSocketUserName(socket);
    socket.join(roomName);
    addRoom(roomName, socket.id, username);

    const newRoom = getRoomIfExist(roomName) as IRoomData;

    io.emit('GET_ROOMS', getAllRooms());
    io.emit('UPDATE_ROOM_DETAILS', { roomName, users: getRoomUsers(newRoom) });
    io.to(socket.id).emit('JOIN_ROOM_DONE', newRoom);
    io.to(newRoom.name).emit('SET_USERS_IN_ROOM', getRoomUsers(newRoom));
};


export const leaveRoom = (io: Server, socket: Socket) => {
    const currentRoom = getCurrentRoom(socket)
    socket.leave(currentRoom.name)
    currentRoom.numberOfUsers = currentRoom.numberOfUsers.filter(user => user.id !== socket.id)

    if (currentRoom.numberOfUsers.length === 0){
        roomsMapp.delete(currentRoom.name)
        io.emit('GET_ROOMS', getAllRooms())
        return
    }
    const allUsers = getRoomUsers(currentRoom)
    io.to(currentRoom.name).emit('SET_USERS_IN_ROOM',allUsers)
    io.emit('UPDATE_ROOM_DETAILS',{roomName:currentRoom.name,users: allUsers})

    if (allUsers.length > 1 && isAllUsersReady(allUsers)){
        io.to(currentRoom.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
    }
}


export const handleDisconnect = (io: Server, socket: Socket) => {
    const username = getSocketUserName(socket)
    const room = getRoomByUserName(username)

    if(room){
        room.numberOfUsers = room.numberOfUsers.filter(user => user.id !== socket.id)
        if (room.numberOfUsers.length === 0){
            roomsMapp.delete(room.name)
            io.emit('GET_ROOMS', getAllRooms())
            return
        }
        const allUsers = getRoomUsers(room)
        io.to(room.name).emit('SET_USERS_IN_ROOM',allUsers)
        io.emit('UPDATE_ROOM_DETAILS',{roomName:room.name,users: allUsers})

        if (allUsers.length > 1 && isAllUsersReady(allUsers)){
              io.to(room.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
        }
    }
}

export const gameStart = (io:Server, currentRoom:string) => {
    const room = getRoomIfExist(currentRoom) as IRoomData
    io.to(room.name).emit('GAME_START')
}

export const changeStatus = (io: Server, socket: Socket) => {
    const currentRoom = getCurrentRoom(socket)
    const user = getUserFromRoom(currentRoom, socket.id) as IUserData
    const allUsers = getRoomUsers(currentRoom)
    user.ready = !user.ready

    if (allUsers.length > 1 && isAllUsersReady(allUsers)){

        io.to(currentRoom.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
    }

    io.to(currentRoom.name).emit('CHANGE_READY_STATUS',user )
}


export const changeProgress = (io: Server,socket: Socket,progress:number) => {
    const currentRoom = getCurrentRoom(socket)
    const user = getUserFromRoom(currentRoom, socket.id) as IUserData
    const allUsers = getRoomUsers(currentRoom)
    user.gameProgress = progress
    if (progress >= 100){
        currentRoom.winnerList.push(user)
    }
    
    io.to(currentRoom.name).emit('CHANGE_PROGRESS', user, allUsers)
}

export const gameOverHandler = (io: Server, socket: Socket) => {
    const currentRoom = getCurrentRoom(socket)
    const allUsers = getRoomUsers(currentRoom)

    if (currentRoom.winnerList.length === allUsers.length){
         io.to(currentRoom.name).emit('GAME_OVER', currentRoom.winnerList)
    } else if (currentRoom.winnerList.length !== 0) {
        const winners = [...currentRoom.winnerList]
        for(const user of allUsers) {
            let isInWinners = false
            for(const winner of winners){
                if(user.id === winner.id) isInWinners = true
            }
            if(!isInWinners) winners.push(user)
        }
        const sortedList = winners.sort((a,b) => b.gameProgress - a.gameProgress)
        io.to(currentRoom.name).emit('GAME_OVER',sortedList)
    } else {
        const sortedList = allUsers.sort((a,b) => b.gameProgress - a.gameProgress)
        io.to(currentRoom.name).emit('GAME_OVER',sortedList)
    }
    currentRoom.winnerList = []
    allUsers.forEach((user) => {
        user.gameProgress = 0
        user.ready = false
    })
    io.to(currentRoom.name).emit('RESET_GAME', allUsers)
}