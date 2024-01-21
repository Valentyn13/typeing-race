import { Server } from 'socket.io';

import * as config from './config.js';
import { enterRoom, createRoom, leaveRoom, handleDisconnect, gameStart, changeProgress, changeStatus } from '../helpers/sockt.helpers.js';
import { getAllRooms, getCurrentRoom, getRoomUsers } from '../helpers/room.helpers.js';


export default (io: Server) => {
    io.on('connection', socket => {

        socket.emit('GET_ROOMS', getAllRooms())

        socket.on('JOIN_ROOM',(roomName:string) =>{
            enterRoom(io,socket,roomName)
        })

        socket.on('CREATE_ROOM',(roomName:string) => {
            createRoom(io,socket,roomName)
        })

        socket.on('LEAVE_ROOM',() => {
            leaveRoom(io,socket)
        })

        socket.on('disconnect',() => {
            handleDisconnect(io, socket)
        })

        socket.on('CHANGE_READY_STATUS',() => {
            changeStatus(io, socket)
        })

        socket.on('GAME_START',(currentRoom) => {
            gameStart(io, currentRoom)
        })

        socket.on('CHANGE_PROGRESS',(progress:number) => {
            changeProgress(io, socket, progress)
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
            currentRoom.winnerList = []
            allUsers.forEach((user) => {
                user.gameProgress = 0
                user.ready = false
            })
            io.to(currentRoom.name).emit('RESET_GAME', allUsers)
        })
    });


};
