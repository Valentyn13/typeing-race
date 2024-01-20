import { Server, Socket } from "socket.io";
import { roomsMapp } from "../data.js";
import { IRoomData, IRoomMap, IUserDataList } from "../types/client.types.js";
import { getUserFromRoom, addUserToRoom, getRoomUsers, addRoom, getRoomIfExist, getAllRooms } from "./room.helpers.js";



export const getSocketUserName = (socket: Socket) => socket.handshake.query.username as string;

export const isAllUsersReady = (users:IUserDataList) => {
    let ready = true
    users.forEach(user => {
        if(!user.ready) ready = false
    })
    return ready
}


export const enterRoom = (io: Server, socket: Socket, room:IRoomData) => {
    const {name} = room
    const username = getSocketUserName(socket)
    const userData = getUserFromRoom(room,socket.id)
    if (!userData){

        socket.join(name)
        addUserToRoom(name,socket.id, username)

        io.emit('UPDATE_ROOM_DETAILS',{roomName:name,users:getRoomUsers(room)})
        io.to(socket.id).emit('JOIN_ROOM_DONE',room)
        io.to(name).emit('SET_USERS_IN_ROOM',getRoomUsers(room))
    }
}


export const createRoom = (io:Server, socket: Socket, roomName:string) => {
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