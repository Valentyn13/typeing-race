import { Server, Socket } from "socket.io";
import { roomsMapp } from "../data.js";
import { IRoomData, IUserDataList } from "../types/client.types.js";
import { addUserToRoom, getRoomUsers, addRoom, getRoomIfExist, getAllRooms } from "./room.helpers.js";
import { MAXIMUM_USERS_FOR_ONE_ROOM } from "../socket/config.js";



export const getSocketUserName = (socket: Socket) => socket.handshake.query.username as string;

export const isAllUsersReady = (users:IUserDataList) => {
    let ready = true
    users.forEach(user => {
        if(!user.ready) ready = false
    })
    return ready
}

export const enterRoom = (io: Server, socket: Socket, roomName:string) => {
    const username = getSocketUserName(socket)
    const gameRoom = getRoomIfExist(roomName)

    if (gameRoom){
        const users =  getRoomUsers(gameRoom)
        console.log("USERS LENGTH:",users.length)
        console.log("USERS:",users)
        if (users.length >= MAXIMUM_USERS_FOR_ONE_ROOM) {
            const reason = 'This room already has 3 members'
            socket.emit('SHOW_ERROR_MODAL', reason)
            return
        }

        socket.join(roomName)
        addUserToRoom(roomName,socket.id, username)

        io.emit('UPDATE_ROOM_DETAILS',{roomName,users})
        io.to(socket.id).emit('JOIN_ROOM_DONE',gameRoom)
        io.to(roomName).emit('SET_USERS_IN_ROOM',users)  
    }
}


export const createRoom = (io:Server, socket: Socket, roomName:string) => {
    if (roomsMapp.has(roomName)){
        const reason = 'Room wiht this name alreasy exist'
        socket.emit('SHOW_ERROR_MODAL', reason)
        return
    }
    const username = getSocketUserName(socket)
    socket.join(roomName)
    addRoom(roomName,socket.id, username)

    const newRoom = getRoomIfExist(roomName) as IRoomData

    io.emit('GET_ROOMS', getAllRooms())
    io.emit('UPDATE_ROOM_DETAILS',{roomName,users:getRoomUsers(newRoom)})
    io.to(socket.id).emit('JOIN_ROOM_DONE',newRoom)
    io.to(newRoom.name).emit('SET_USERS_IN_ROOM',getRoomUsers(newRoom))
}


export const randomArrayIndex = (arr:string[]) => {
    return Math.floor(Math.random()* arr.length)
}