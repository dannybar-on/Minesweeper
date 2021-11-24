'use strict';

// Global Variables
var gBoard;

const FLAG_IMG = '&#x1F6A9;';
const MINE_IMG = '&#x1F4A3;';

var gLevel = {
  SIZE: 4,
  MINES: 2,
};

var gGame = {
  isOn: false,
};

function initGame() {
  gGame.isOn = true;
  gBoard = buildBoard();
  setMinesOnBoard(gBoard, gLevel.MINES);
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      var currCell = gBoard[i][j];

      if (currCell.isMine) {
        console.log(i, j);
      }
    }
  }
  renderBoard(gBoard);
}

function buildBoard() {
  var board = [];

  for (var i = 0; i < gLevel.SIZE; i++) {
    board[i] = [];

    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j] = {
        minesAroundCount: null,
        isShown: false,
        isMine: false,
        isMarked: false,
      };
    }
  }

  return board;
}

function renderBoard(board) {
  var elBoard = document.querySelector('.board');
  var strHTML = '';

  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';

    for (var j = 0; j < board[0].length; j++) {
      var currCell = board[i][j];
      var className = 'cell-' + i + '-' + j;

      if (!currCell.isShown) className += ' hidden';

      strHTML += `<td class="cell ${className}" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="setFlag(this, event, ${i}, ${j})"></td>`;
    }

    strHTML += '</tr>';
  }

  elBoard.innerHTML = strHTML;
}

function setMinesNegsCount(board, row, col) {
  var minesNegsCount = 0;

  for (var i = row - 1; i <= row + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;

    for (var j = col - 1; j <= col + 1; j++) {
      if (j < 0 || j > board[i].length - 1) continue;
      if (i === row && j === col) continue;

      if (board[i][j].isMine) minesNegsCount++;
    }
  }

  return minesNegsCount;
}

function cellClicked(cell, row, col) {
  if (!gGame.isOn) return;

  var clickedCell = gBoard[row][col];

  if (clickedCell.isShown) return;
  if (clickedCell.isMarked) return;

  clickedCell.isShown = true;

  if (clickedCell.isMine) return endGame();

  var minesNegsCount = setMinesNegsCount(gBoard, row, col);

  cell.classList.remove('hidden');
  cell.style.color = colorizeCell(minesNegsCount);
  cell.innerHTML = minesNegsCount;

  if (!minesNegsCount) expandNegs(row, col);

  if (checkGame()) return endGame(true);
}

function setMinesOnBoard(board, amount) {
  for (var i = 0; i < amount; i++) {
    var row = getRandomInt(0, board.length);
    var col = getRandomInt(0, board[0].length);

    if (board[row][col].isMine) i--;

    board[row][col].isMine = true;
  }
}

function setFlag(cell, event, row, col) {
  event.preventDefault();

  if (!gGame.isOn) return;

  var clickedCell = gBoard[row][col];

  if (clickedCell.isShown) return;

  clickedCell.isMarked = !clickedCell.isMarked;
  cell.innerHTML = clickedCell.isMarked ? FLAG_IMG : '';
}

function endGame(isWin = false) {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      var currCell = gBoard[i][j];

      if (currCell.isMine) {
        var elCell = document.querySelector(`.cell-${i}-${j}`);

        elCell.innerHTML = !isWin ? MINE_IMG : FLAG_IMG;
      }
    }
  }

  gGame.isOn = false;
}

function checkGame() {
  var correctCells = 0;

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      var currCell = gBoard[i][j];

      if (currCell.isShown && !currCell.isMine) correctCells++;
    }
  }

  return correctCells === gLevel.SIZE * gLevel.SIZE - gLevel.MINES
    ? true
    : false;
}

function difficultyLevel(level) {
  switch (level) {
    case 'beginner':
      gLevel.SIZE = 4;
      gLevel.MINES = 2;
      break;
    case 'medium':
      gLevel.SIZE = 8;
      gLevel.MINES = 12;
      break;
    case 'expert':
      gLevel.SIZE = 12;
      gLevel.MINES = 30;
      break;
  }

  initGame();
}

function expandNegs(row, col) {
  for (var i = row - 1; i <= row + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = col - 1; j <= col + 1; j++) {
      if (j < 0 || j > gBoard[i].length - 1) continue;
      if (i === row && j === col) continue;

      var minesNegsCount = setMinesNegsCount(gBoard, i, j);

      if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
        var elCell = document.querySelector(`.cell-${i}-${j}`);

        elCell.classList.remove('hidden');
        elCell.style.color = colorizeCell(minesNegsCount);
        elCell.innerHTML = minesNegsCount;
        gBoard[i][j].isShown = true;

        if (!minesNegsCount) expandNegs(i, j);
      }
    }
  }
}

function colorizeCell(num) {
  var color = '';

  switch (num) {
    case 1:
      color = 'blue';
      break;
    case 2:
      color = 'green';
      break;
    case 3:
      color = 'red';
      break;
    case 4:
      color = 'black';
      break;
    default:
      color = '#9a9a9a';
      break;
  }

  return color;
}
