import { Server } from 'socket.io';

import * as config from './config.js';
import { enterRoom, createRoom, isAllUsersReady, randomArrayIndex } from '../helpers/sockt.helpers.js';
import { IRoomData, IUserData } from '../types/client.types.js';
import { texts } from '../data.js';
import { getAllRooms, getRoomIfExist, getCurrentRoom, getUserFromRoom, getRoomUsers } from '../helpers/room.helpers.js';


export default (io: Server) => {
    io.on('connection', socket => {

        socket.emit('GET_ROOMS', getAllRooms())

        socket.on('JOIN_ROOM',(roomName:string) =>{
            
            const isRoomExist =  getRoomIfExist(roomName)
            if (isRoomExist ){
                enterRoom(io,socket, isRoomExist)
            }else{
                createRoom(io, socket,roomName)
            }
            console.log(io.sockets.adapter.rooms)
        })


        socket.on('CHANGE_READY_STATUS',() => {
            const currentRoom = getCurrentRoom(socket)
            const user = getUserFromRoom(currentRoom, socket.id) as IUserData
            const allUsers = getRoomUsers(currentRoom)
            user.ready = !user.ready

            if (allUsers.length > 1 && isAllUsersReady(allUsers)){

                io.to(currentRoom.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
            }

            io.to(currentRoom.name).emit('CHANGE_READY_STATUS',user,allUsers )
        })

        socket.on('GAME_START',(currentRoom) => {
            const room = getRoomIfExist(currentRoom) as IRoomData
            io.to(room.name).emit('GAME_START')
        })

        socket.on('CHANGE_PROGRESS',(progress) => {
            const currentRoom = getCurrentRoom(socket)
            const user = getUserFromRoom(currentRoom, socket.id) as IUserData
            const allUsers = getRoomUsers(currentRoom)
            user.gameProgress = progress
            if (progress >= 100){
                currentRoom.winnerList.push(user)
            }
            
            io.to(currentRoom.name).emit('CHANGE_PROGRESS', user, allUsers)
        })

        socket.on('GAME_OVER',() => {
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
            
        })
    });


};
