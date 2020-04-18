'use strict'
const store = require('./store')
const gameApi = require('./game-api/game-api')
const ui = require('./auth/ui')

const huPlayer = 'O'
const aiPlayer = 'X'
const winCondition = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [0, 4, 8]
]

function changeTurn () {
  $('#invalid-move-message').html('&nbsp;')
  if (store.pveTurn === 'Player') {
    store.pveTurn = 'AI'
    if (store.aiLevel === 'Randometric') {
      easyAiMove()
    } else if (store.aiLevel === 'Mechanico') {
      medAiMove()
    } else {
      hardAiMove()
    }
  } else {
    store.pveTurn = 'Player'
  }
}

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max))
}

function checkWin (board, player) {
  const plays = board.reduce((a, e, i) =>
    (e === player) ? a.concat(i) : a, [])
  let gameWon = null
  for (const [index, win] of winCondition.entries()) {
    if (win.every(elem => plays.indexOf(elem) > -1)) {
      gameWon = {index: index, player: player}
      break
    }
  }
  return gameWon
}

function gameOver (gameWon) {
  store.game.game.over = true
  if (store.pveTurn === 'Player') {
    store.winningPlayer = store.user.email
  } else {
    store.winningPlayer = store.aiLevel
  }
  $('#game-state-message').text(store.winningPlayer + ' wins!')
  gameApi.updateGame(store.game)
  $('#invalid-move-message').html('Game is over <button class="btn btn-outline-light restart">restart?</button>')
}

const checkDraw = function () {
  if ((store.game.game.cells.every(v => typeof v !== 'number')) && (store.game.game.over === false)) {
    $('#game-state-message').text('Draw!')
    $('#invalid-move-message').html('Game is over <button class="btn btn-outline-light restart">restart?</button>')
    store.game.game.over = true
    gameApi.updateGame(store.game)
  }
}

function emptySquares () {
  return store.game.game.cells.filter(s => typeof s === 'number')
}

function bestSpot () {
  return minimax(store.game.game.cells, aiPlayer).index
}

function setAiEasy () {
  store.aiLevel = 'Randometric'
  newGame()
}

function setAiMed () {
  store.aiLevel = 'Mechanico'
  newGame()
}

function setAiHard () {
  store.aiLevel = 'Minimaximus'
  newGame()
}

function newGame () {
  store.gameType = 'ai'
  store.game.game.cells = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  $('#player-2-label').text(store.aiLevel)
  $('#game-state-message').html(store.user.email + ' vs ' + store.aiLevel)
  $('#right-box').removeClass('player-box Randometric-box Mechanico-ai-box Minimaximus-box')
  $('#left-box').removeClass('player-box Randometric-box Mechanico-ai-box Minimaximus-box')
  $('#right-box').addClass(`${store.aiLevel}-box`)
  $('#left-box').addClass('player-box')
  gameApi.createGame()
    .then(ui.newGameSuccess)
    .catch(ui.newGameFailure)
}

function easyAiMove () {
  const random = getRandomInt(9)
  if (typeof store.game.game.cells[random] === 'number') {
    $(`.box[id=${random}]`).text(aiPlayer)
    $(`.box[id=${random}]`).addClass(aiPlayer.toLowerCase())
    store.game.game.cells.splice(random, 1, aiPlayer)
    console.log(store.game)
    console.log(store.game.game.cells)
    const gameWon = checkWin(store.game.game.cells, aiPlayer)
    if (gameWon) {
      gameOver(gameWon)
    } else {
      checkDraw()
      if (store.game.game.over === false) {
        changeTurn()
      }
    }
  } else {
    easyAiMove()
  }
}

function medAiMove () {
  const random = getRandomInt(4)
  if ((store.game.game.over === false) && (typeof store.game.game.cells[4] === 'number')) {
    $('#4').text(aiPlayer)
    $('#4').addClass(aiPlayer.toLowerCase())
    store.game.game.cells.splice(4, 1, aiPlayer)
    const gameWon = checkWin(store.game.game.cells, aiPlayer)
    if (gameWon) {
      gameOver(gameWon)
    } else {
      checkDraw()
      if (store.game.game.over === false) {
        changeTurn()
      }
    }
  } else if (store.game.game.over === false && typeof store.game.game.cells[store.corners[random]] === 'number') {
    $(`#${store.corners[random]}`).text(aiPlayer)
    $(`#${store.corners[random]}`).addClass(aiPlayer.toLowerCase())
    store.game.game.cells.splice(store.corners[random], 1, aiPlayer)
    const gameWon = checkWin(store.game.game.cells, aiPlayer)
    if (gameWon) {
      gameOver(gameWon)
    } else {
      checkDraw()
      if (store.game.game.over === false) {
        changeTurn()
      }
    }
  } else if (store.game.game.over === false && typeof store.game.game.cells[store.corners[random]] === 'number') {
    $(`#${store.sides[random]}`).text(aiPlayer)
    $(`#${store.sides[random]}`).addClass(aiPlayer.toLowerCase())
    store.game.game.cells.splice(store.sides[random], 1, aiPlayer)
    const gameWon = checkWin(store.game.game.cells, aiPlayer)
    if (gameWon) {
      gameOver(gameWon)
    } else {
      checkDraw()
      if (store.game.game.over === false) {
        changeTurn()
      }
    }
  } else {
    medAiMove()
  }
}

function hardAiMove () {
  console.log(bestSpot())
  $(`#${bestSpot()}`).text(aiPlayer)
  $(`#${bestSpot()}`).addClass(aiPlayer.toLowerCase())
  store.game.game.cells.splice(bestSpot(), 1, aiPlayer)
  const gameWon = checkWin(store.game.game.cells, aiPlayer)
  if (gameWon) {
    gameOver(gameWon)
  } else {
    checkDraw()
    if (store.game.game.over === false) {
      changeTurn()
    }
  }
}

function minimax (newBoard, player) {
  const availSpots = emptySquares()

  if (checkWin(newBoard, huPlayer)) {
    return {score: -10}
  } else if (checkWin(newBoard, aiPlayer)) {
    return {score: 10}
  } else if (availSpots.length === 0) {
    return {score: 0}
  }
  const moves = []
  for (let i = 0; i < availSpots.length; i++) {
    const move = {}
    move.index = newBoard[availSpots[i]]
    newBoard[availSpots[i]] = player

    if (player === aiPlayer) {
      const result = minimax(newBoard, huPlayer)
      move.score = result.score
    } else {
      const result = minimax(newBoard, aiPlayer)
      move.score = result.score
    }

    newBoard[availSpots[i]] = move.index

    moves.push(move)
  }

  let bestMove
  if (player === aiPlayer) {
    let bestScore = -10000
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  } else {
    let bestScore = 10000
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  }

  return moves[bestMove]
}

const huMove = function (event) {
  event.preventDefault()
  // get the position in the aray that they moved to
  const position = event.target.id
  // get the curent text of the space the player chose
  const space = $(event.target).text()
  // if space is open
  if (space === '' && store.game.game.over === false) {
    // add them to the boad
    $(event.target).text(huPlayer)
    $(event.target).addClass(huPlayer.toLowerCase())
    // Update local game board
    store.game.game.cells.splice(position, 1, huPlayer)
    // Update API game board
    gameApi.updateGame({
      'game': {
        'cell': {
          'index': position,
          'value': store.pveTurn
        },
        'over': store.game.game.over
      }
    })
    // check for winner
    const gameWon = checkWin(store.game.game.cells, huPlayer)
    if (gameWon) {
      gameOver(gameWon)
    } else {
      checkDraw()
      if (store.game.game.over === false) {
        changeTurn()
      }
    }
  } else {
    $('#invalid-move-message').text('Invalid move')
  }
}

module.exports = {
  huMove,
  setAiEasy,
  setAiMed,
  setAiHard,
  newGame
}
