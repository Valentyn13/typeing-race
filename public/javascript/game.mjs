import { addClass, removeAllChildNodes, removeClass } from "./helpers/dom-helper.mjs";
import { changeUserReadyStatus, handleWindowKeyDown, setRoomName, setUsersInRoom, startTimer } from "./views/game-field.mjs";
import { showInputModal, showMessageModal, showResultsModal } from "./views/modal.mjs";
import { appendRoomElement, updateNumberOfUsersInRoom } from "./views/room.mjs";

const username = sessionStorage.getItem('username');
const addRoomBnt = document.getElementById('add-room-btn')
const roomsPage = document.getElementById('rooms-page')
const gamePage = document.getElementById('game-page')
let roomName = ''

const redyButton = document.getElementById('ready-btn')

// import {SECONDS_TIMER_BEFORE_START_GAME, SECONDS_FOR_GAME} from './../../src/socket/config'

export let currentRoom = null
export let isGameOver = false
let isResultShown = false

if (!username) {
    window.location.replace('/login');
}

export const socket = io('', { query: { username } });

socket.on('connect_error',error => {
    console.log(error)
    sessionStorage.removeItem('username')
    showMessageModal({message:'User with this name already connected', onClose:() => window.location.replace('/login')})
  
})

redyButton.addEventListener('click',(e) => {

    if(e.target.innerText === 'READY'){
        e.target.innerText = 'NOT READY'
    } else {
        e.target.innerText = 'READY'
    }
    socket.emit('CHANGE_READY_STATUS')
})


addRoomBnt.addEventListener('click',() =>{
    showInputModal({title:'New room', onChange: (text) => {
        roomName = text
    }, onSubmit:() => {
        
        socket.emit('JOIN_ROOM',roomName)
        
    }})
})

const connectToRoom = (e) => {
    const roomName = e.target.dataset.roomName
    socket.emit('JOIN_ROOM',roomName)
}


socket.on('GET_ROOMS',(rooms) => {
    const roomsContainer = document.querySelector('#rooms-wrapper');
    removeAllChildNodes(roomsContainer)
    rooms.forEach(room => {
        const {name, numberOfUsers} = room
        const amountOfusers = numberOfUsers.length
        appendRoomElement({name, numberOfUsers: amountOfusers,onJoin: connectToRoom})
    })
})

socket.on('UPDATE_ROOM_DETAILS',(room) => {
    const {roomName, users} = room
    updateNumberOfUsersInRoom({name:roomName, numberOfUsers: users.length})
})

socket.on('JOIN_ROOM_DONE',(data) => {
    currentRoom = data.name
    setRoomName(data.name)
   addClass(roomsPage,'display-none')
    removeClass(gamePage, 'display-none')
})

socket.on('SET_USERS_IN_ROOM',(users) =>{
    setUsersInRoom(users)
})


socket.on('CHANGE_READY_STATUS',(user, allUsers) => {

    const {id} = user
    changeUserReadyStatus(id)
})


socket.on('GAME_START_TRIGGER', async (index) => {
    startTimer(socket, 5, index)
})

socket.on('GAME_START', () => {
    window.addEventListener('keydown',handleWindowKeyDown)
})


socket.on('CHANGE_PROGRESS',(user, allUsers) => {
    const {id, gameProgress} = user
    const userProgress = document.querySelector(`[data-user-progress='${id}']`)
    userProgress.style.width = `${gameProgress}%`

    if(gameProgress >= 100) {
        addClass(userProgress,'finished')
        
    }
    const isGameFinished = allUsers.every((user) => user.gameProgress >= 100)
    if (isGameFinished){
        isGameOver = true
        socket.emit('GAME_OVER')
    }

})


socket.on('GAME_OVER',(winners) => {
    if (!isResultShown){
        console.dir(winners)
        const userNames = winners.map(winner => {
            return winner.userName
        })
        showResultsModal({usersSortedArray: userNames})
        isResultShown = true
    }
})