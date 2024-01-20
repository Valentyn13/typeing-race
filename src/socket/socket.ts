import { Server } from 'socket.io';

import * as config from './config.js';
import { enterRoom, createRoom, isAllUsersReady, randomArrayIndex, getSocketUserName } from '../helpers/sockt.helpers.js';
import { IRoomData, IUserData } from '../types/client.types.js';
import { roomsMapp, texts } from '../data.js';
import { getAllRooms, getRoomIfExist, getCurrentRoom, getUserFromRoom, getRoomUsers, getRoomByUserName } from '../helpers/room.helpers.js';


export default (io: Server) => {
    io.on('connection', socket => {

        socket.emit('GET_ROOMS', getAllRooms())

        socket.on('JOIN_ROOM',(roomName:string) =>{
            enterRoom(io,socket,roomName)
            console.log(io.sockets.adapter.rooms)
        })

        socket.on('CREATE_ROOM',(roomName:string) => {
            createRoom(io,socket,roomName)
        })

        socket.on('LEAVE_ROOM',() => {
            const currentRoom = getCurrentRoom(socket)
            socket.leave(currentRoom.name)
            currentRoom.numberOfUsers = currentRoom.numberOfUsers.filter(user => user.id !== socket.id)
            if (currentRoom.numberOfUsers.length === 0){
                roomsMapp.delete(currentRoom.name)
                io.emit('GET_ROOMS', getAllRooms())
            } else {
                const allUsers = getRoomUsers(currentRoom)
                io.to(currentRoom.name).emit('SET_USERS_IN_ROOM',allUsers)
                io.emit('UPDATE_ROOM_DETAILS',{roomName:currentRoom.name,users: allUsers})

                if (allUsers.length > 1 && isAllUsersReady(allUsers)){

                    io.to(currentRoom.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
                }
    
            }

        })

        socket.on('disconnect',() => {
           // console.log(io.sockets.adapter.rooms)
            const username = getSocketUserName(socket)
            const room = getRoomByUserName(username)

            if(room){
                room.numberOfUsers = room.numberOfUsers.filter(user => user.id !== socket.id)
                if (room.numberOfUsers.length === 0){
                    roomsMapp.delete(room.name)
                    io.emit('GET_ROOMS', getAllRooms())
                } else{
                    const allUsers = getRoomUsers(room)
                    io.to(room.name).emit('SET_USERS_IN_ROOM',allUsers)
                    io.emit('UPDATE_ROOM_DETAILS',{roomName:room.name,users: allUsers})

                    if (allUsers.length > 1 && isAllUsersReady(allUsers)){

                        io.to(room.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
                    }
        
                }
            }
        })

        socket.on('CHANGE_READY_STATUS',() => {
            const currentRoom = getCurrentRoom(socket)
            const user = getUserFromRoom(currentRoom, socket.id) as IUserData
            const allUsers = getRoomUsers(currentRoom)
            user.ready = !user.ready

            if (allUsers.length > 1 && isAllUsersReady(allUsers)){

                io.to(currentRoom.name).emit('GAME_START_TRIGGER',randomArrayIndex(texts))
            }

            io.to(currentRoom.name).emit('CHANGE_READY_STATUS',user )
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
            currentRoom.winnerList = []
            allUsers.forEach((user) => {
                user.gameProgress = 0
                user.ready = false
            })

            //io.to(currentRoom.name).emit('CHANGE_READY_STATUS',allUsers )
            io.to(currentRoom.name).emit('RESET_GAME', allUsers)
        })
    });


};
