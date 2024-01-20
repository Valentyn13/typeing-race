import { Socket } from "socket.io"
import { roomsMapp } from "../data.js"
import { IRoomData, IUserDataList } from "../types/client.types.js"

export const getAllRooms = () => {
    return [...roomsMapp.values()]
}

export const getRoomByUserName = (userName:string) => {
    const rooms = getAllRooms()
    const room = rooms.find(room => room.numberOfUsers.some(user => user.userName === userName))
    return room
}

export const getCurrentRoom = (socket:Socket) =>{
    const rooms = getAllRooms()
    const room = rooms.find(room => socket.rooms.has(room.name))
    return room as IRoomData
} 


export const getRoomIfExist = (roomName:string) => {
    return roomsMapp.get(roomName)
}


export const addUserToRoom = (roomName:string, id:string, userName:string) => {
    const room = getRoomIfExist(roomName) as IRoomData
    room.numberOfUsers.push({
        id,
        userName,
        ready:false,
        gameProgress:0
    })
}


export const getUserFromRoom = (room:IRoomData, userId:string) => {
    return room.numberOfUsers.find(user => user.id === userId)
 }


 
export const getRoomUsers =(room:IRoomData) => {
    return room.numberOfUsers
}

export const addRoom = (roomName:string, id:string, userName:string) => {
    const userDetails = [] as IUserDataList;
    userDetails.push({
        id,
        userName,
        ready:false,
        gameProgress:0
    })
    roomsMapp.set(roomName,{name:roomName,numberOfUsers:userDetails,winnerList:[]})
}