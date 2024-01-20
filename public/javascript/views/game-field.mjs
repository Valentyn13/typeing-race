import { currentRoom, isGameOver } from "../game.mjs";
import { addClass, createElement, removeClass } from "../helpers/dom-helper.mjs";
import { getTextForGame } from "../helpers/get-text-helper.mjs";
import {socket} from './../game.mjs'

const roomHeader = document.getElementById('room-name')
const leaveButton = document.getElementById('quit-room-btn')
const userList = document.getElementById('users-wrapper')
const redyButton = document.getElementById('ready-btn')


const timerToStart = document.getElementById('timer')

const gameText = document.getElementById('text-container')

const gameTimerContainer = document.getElementById('game-timer')
const gameTimerSeconds = document.getElementById('game-timer-seconds')

let gameTimer;
let textForTyping = null


export const clearGameTimer = () =>{
    clearInterval(gameTimer)
}
export let pressedKeys = []

export const handleWindowKeyDown = (e) => {
    const quoteArray = gameText.querySelectorAll('span')
    const keyValue = e.key

    if (pressedKeys.length === 0){
        if (keyValue === textForTyping[0]){
            pressedKeys.push(keyValue)
            quoteArray[0].classList.add('typed')
            const progress = calculateProgress(pressedKeys.length, textForTyping.length)
            socket.emit('CHANGE_PROGRESS',progress)
        }

    } else {
        if(keyValue === textForTyping[pressedKeys.length]){
            pressedKeys.push(keyValue)
            quoteArray[pressedKeys.length - 1].classList.add('typed')
            const progress = calculateProgress(pressedKeys.length, textForTyping.length)
            socket.emit('CHANGE_PROGRESS',progress)
        }
    }

    if (pressedKeys.length === textForTyping.length){

    }

}

export const renderGameText = (text) => {
    gameText.innerHTML = ''

    text.split('').forEach(character => {
        const characterSpan = createElement({tagName:'span'})
        characterSpan.innerText = character
        gameText.appendChild(characterSpan)
    })
}


export const setRoomName = (roomName) =>{
roomHeader.innerText = roomName
}

export const hideElements = () => {
    addClass(leaveButton,'display-none') 
    addClass(redyButton,'display-none')
    removeClass(timerToStart,'display-none')
}
export const resetGameField = (users) => {
    removeClass(leaveButton,'display-none')
    removeClass(redyButton,'display-none')
    addClass(gameText,'display-none')
    addClass(gameTimerContainer,'display-none')
    setUsersInRoom(users)
}


export const startTimer = async (socket, duration, index) => {
    pressedKeys = []
    const quote = await getTextForGame(index)
    textForTyping = quote
    hideElements()
 let timer = duration
 timerToStart.innerText = timer
 let coundDown = setInterval(() => {
    
    timerToStart.innerText = timer;

    if (--timer <0){
        clearInterval(coundDown)
        addClass(timerToStart,'display-none')
        renderGameText(quote)
        removeClass(gameText,'display-none')
        gameDurationTimer(socket,30)
        socket.emit('GAME_START',currentRoom)
    }
 },1000)
}

const gameDurationTimer = (socket, duration) => {
    let timer = duration
    gameTimerSeconds.innerText = timer
    removeClass(gameTimerContainer, 'display-none')
    
    gameTimer = setInterval(() => {
        if (isGameOver) clearInterval(gameTimer)
        gameTimerSeconds.innerText = timer
        if (--timer < 0) {
            clearInterval(gameTimer)
            if (!isGameOver){
                socket.emit('GAME_OVER')
            }
            
        }
    },1000)
}


const createUserForGame = (userName, userId, ready) => {
    const userWrapper = createElement({tagName:'div', className:'user'})
    const userHeader = createElement({tagName:'div', className:'user-header'})

    const status = createElement({tagName:'div', className:`${ready ? 'user__status user__status-active' : 'user__status'}`, attributes:{
        'data-user-id':userId
    }})
    const name = createElement({tagName:'span', className:'username'})
    name.innerText = userName
    userHeader.append(status, name)

    const userProgressElementContainer = createElement({tagName:'div', className:'user-progress-template'})
    const userProgress = createElement({tagName:'div', className:'user-progress', attributes:{
        'data-user-progress':userId
    }})
    userProgressElementContainer.appendChild(userProgress)
    userWrapper.append(userHeader, userProgressElementContainer)
    return userWrapper
}

export const setUsersInRoom = (users) => {
    userList.innerHTML=''
    users.forEach(user => {
        const {userName, id, ready} = user
        userList.appendChild(createUserForGame(userName, id, ready))
    });
}

export const changeUserReadyStatus = (userId) => {
    const userStatus = document.querySelector(`[data-user-id='${userId}']`)
    userStatus.classList.toggle('user__status-active')
}


export function calculateProgress(current,all){
    const progress = (current / all) * 100;
    return progress
}


