'use strict';

var gBoard;

const FLAG_IMG = '🏴';
const MINE_IMG = '💣';
const FLAGGED_MINE_IMG = '❌';
const NORMAL_SMILEY = '😎';
const LOST_SMILEY = '🙁';
const WON_SMILEY = '🥳';
const HINT = '💡';
const USED_HINT = '✨';

var gLevel = {
  NAME: 'expert',
  SIZE: 12,
  MINES: 30,
};

var gGame = {
  isOn: false,
  lives: 3,
  hints: 3,
  safeClicks: 3,
  manualMineCount: 0,
  prevSafeClick: { row: null, col: null },
  firstClickedCell: false,
  firstClickedFlag: false,
  hintClicked: false,
  safeClicked: false,
  isManualMode: false,
  isManuallyPos: false,
  isManuallyFinished: true,
  startTime: null,
  loopGame: null,
  boardSteps: [],
};

function initGame() {
  restartGame();
  gBoard = buildBoard();
  renderBoard(gBoard);
}

function buildBoard() {
  var board = [];

  for (var i = 0; i < gLevel.SIZE; i++) {
    board[i] = [];

    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j] = {
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
      var currEl = '';
      var currColor = '';

      if (currCell.isMarked) currEl = FLAG_IMG;
      if (currCell.isShown) {
        if (currCell.isMine) {
          currColor = 'style="background-color: tomato"';
          currEl = MINE_IMG;
        } else {
          var minesNegsCount = setMinesNegsCount(board, i, j);
          currColor = `style="color: ${colorizeCell(minesNegsCount)}"`;
          currEl = minesNegsCount;
        }
      } else {
        className += ' hidden';
      }

      strHTML += `<td class="cell ${className}" ${currColor} onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="setFlag(this, event, ${i}, ${j})">${currEl}</td>`;
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

  if (gGame.isManualMode && !gGame.isManuallyPos) {
    if (clickedCell.isMine) return;

    var elCell = document.querySelector(`.cell-${row}-${col}`);

    elCell.classList.remove('hidden');
    elCell.innerHTML = MINE_IMG;
    clickedCell.isMine = true;
    gGame.manualMineCount++;

    if (gGame.manualMineCount === gLevel.MINES) {
      setTimeout(() => {
        for (var i = 0; i < gBoard.length; i++) {
          for (var j = 0; j < gBoard.length; j++) {
            var currCell = gBoard[i][j];

            if (currCell.isMine) {
              var remCell = document.querySelector(`.cell-${i}-${j}`);

              remCell.classList.add('hidden');
              remCell.innerHTML = '';
            }
          }
        }

        gGame.isManuallyFinished = true;
      }, 1000);
      gGame.isManuallyPos = true;
    }

    return;
  }

  if (!gGame.isManuallyFinished) return;
  if (clickedCell.isShown) return;
  if (clickedCell.isMarked) return;
  if (gGame.safeClicked) return;

  if (!gGame.firstClickedCell) {
    if (!gGame.firstClickedFlag) {
      gGame.startTime = Date.now();
      gGame.loopGame = setInterval(gameTimer, 100);
    }

    gGame.firstClickedCell = true;

    if (!gGame.isManuallyPos) {
      setMinesOnBoard(gBoard, gLevel.MINES, clickedCell);
    }
  }

  if (gGame.hintClicked) return hintShow(row, col);

  gGame.boardSteps.push(storeBoardSteps(gBoard));
  clickedCell.isShown = true;

  if (clickedCell.isMine) {
    var elCell = document.querySelector(`.cell-${row}-${col}`);
    var elLives = document.querySelector('.lives');

    gGame.lives--;
    elCell.innerHTML = MINE_IMG;
    elCell.style.backgroundColor = 'tomato';
    elLives.innerHTML = gGame.lives;

    if (gGame.lives === 0) return endGame();

    return;
  }

  var minesNegsCount = setMinesNegsCount(gBoard, row, col);

  cell.classList.remove('hidden');
  cell.style.color = colorizeCell(minesNegsCount);
  cell.innerHTML = minesNegsCount;

  if (!minesNegsCount) expandNegs(row, col);

  if (checkGame()) return endGame(true);
}

function setMinesOnBoard(board, amount, cell) {
  for (var i = 0; i < amount; i++) {
    var row = getRandomInt(0, board.length);
    var col = getRandomInt(0, board[0].length);

    if (cell === board[row][col] && gGame.firstClickedCell) {
      i--;
      continue;
    }

    if (board[row][col].isMine) i--;

    board[row][col].isMine = true;
  }
}

function setFlag(cell, event, row, col) {
  event.preventDefault();

  if (!gGame.isOn) return;

  if (!gGame.firstClickedFlag && !gGame.firstClickedCell) {
    gGame.startTime = Date.now();
    gGame.loopGame = setInterval(gameTimer, 100);
    gGame.firstClickedFlag = true;
  }

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
        var elSmiley = document.querySelector('.smiley');

        if (!isWin) {
          elCell.innerHTML = currCell.isMarked ? FLAGGED_MINE_IMG : MINE_IMG;
          elSmiley.innerHTML = LOST_SMILEY;
        } else {
          elCell.innerHTML = FLAG_IMG;
          elSmiley.innerHTML = WON_SMILEY;
        }
      }
    }
  }

  gGame.isOn = false;
  clearInterval(gGame.loopGame);

  if (isWin) {
    var elTimer = document.querySelector('.timer');

    saveScore(gLevel.NAME, elTimer.innerHTML);
  }
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
      gLevel.NAME = 'beginner';
      gLevel.SIZE = 4;
      gLevel.MINES = 2;
      break;
    case 'medium':
      gLevel.NAME = 'medium';
      gLevel.SIZE = 8;
      gLevel.MINES = 12;
      break;
    case 'expert':
      gLevel.NAME = 'expert';
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
    case 5:
      color = 'brown';
      break;
    case 6:
      color = 'cyan';
      break;
    case 7:
      color = 'purple';
      break;
    case 8:
      color = 'yellow';
    default:
      color = '#9a9a9a';
      break;
  }

  return color;
}

function gameTimer() {
  var elapsedTime = Date.now() - gGame.startTime;
  var elTimer = document.querySelector('.timer');

  elTimer.innerHTML = (elapsedTime / 1000).toFixed(1);
}

function restartGame() {
  var elTimer = document.querySelector('.timer');
  var elScores = document.querySelector('.scores');
  var elLives = document.querySelector('.lives');
  var elSmiley = document.querySelector('.smiley');
  var elHint = document.querySelector('.hints');
  var elSafeClicks = document.querySelector('.safe-clicks');

  gGame.isOn = true;
  gGame.lives = 3;
  gGame.hints = 3;
  gGame.safeClicks = 3;
  gGame.manualMineCount = 0;
  gGame.firstClickedCell = false;
  gGame.firstClickedFlag = false;
  gGame.hintClicked = false;
  gGame.safeClicked = false;
  gGame.isManualMode = false;
  gGame.isManuallyPos = false;
  gGame.isManuallyFinished = true;
  elTimer.innerHTML = 0;
  elScores.innerHTML = renderScores();
  elLives.innerHTML = gGame.lives;
  elSmiley.innerHTML = NORMAL_SMILEY;
  elHint.innerHTML = renderHints(3);
  elSafeClicks.innerHTML = `${gGame.safeClicks} clicks available`;
  gGame.boardSteps = [];
  clearInterval(gGame.loopGame);
}

function renderHints(amount) {
  var hints = '';

  for (var i = 0; i < amount; i++) {
    hints += `<span onclick="hintClicked(this)">${HINT}</span>`;
  }

  return hints;
}

function hintClicked(elHints) {
  if (!gGame.isOn || !gGame.firstClickedCell) return;
  if (!gGame.hints || gGame.hintClicked) return;
  if (gGame.safeClicked) return;

  gGame.hints--;
  gGame.hintClicked = true;
  elHints.innerHTML = USED_HINT;
  elHints.style.cursor = 'default';
}

function hintShow(row, col) {
  toggleHintNegs(true, row, col);
  setTimeout(() => {
    gGame.hintClicked = false;
    toggleHintNegs(false, row, col);
  }, 1000);
}

function toggleHintNegs(toggle, row, col) {
  for (var i = row - 1; i <= row + 1; i++) {
    if (i < 0 || i > gBoard.length - 1) continue;
    for (var j = col - 1; j <= col + 1; j++) {
      if (j < 0 || j > gBoard[i].length - 1) continue;

      var minesNegsCount = setMinesNegsCount(gBoard, i, j);

      if (!gBoard[i][j].isShown) {
        var elCell = document.querySelector(`.cell-${i}-${j}`);

        if (toggle) {
          elCell.classList.remove('hidden');

          if (gBoard[i][j].isMine) {
            elCell.innerHTML = MINE_IMG;
            continue;
          }

          elCell.style.color = colorizeCell(minesNegsCount);
          elCell.innerHTML = minesNegsCount;
        } else {
          elCell.classList.add('hidden');
          elCell.innerHTML = '';
        }
      }
    }
  }
}

function renderScores() {
  var scores = '';

  for (var i = 1; i <= 3; i++) {
    var level = '';

    switch (i) {
      case 1:
        level = 'beginner';
        break;
      case 2:
        level = 'medium';
        break;
      case 3:
        level = 'expert';
        break;
    }

    if (localStorage.getItem(level) === null)
      localStorage.setItem(level, '0');

    scores += `<tr><td>${level}</td><td class="${level}">${localStorage.getItem(level)}</td></tr>`;
  }

  return scores;
}

function saveScore(level, score) {
  var elScore = document.querySelector(`.${level}`);

  localStorage.setItem(level, score);
  elScore.innerHTML = localStorage.getItem(level);
}

function safeClick() {
  if (!gGame.isOn || !gGame.firstClickedCell) return;
  if (!gGame.safeClicks || gGame.safeClicked) return;
  if (gGame.hintClicked) return;

  var elSafeClicks = document.querySelector('.safe-clicks');

  toggleSafeClick(true);
  gGame.safeClicks--;
  gGame.safeClicked = true;
  elSafeClicks.innerHTML = `${gGame.safeClicks} clicks available`;
  setTimeout(() => {
    gGame.safeClicked = false;
    toggleSafeClick(false);
  }, 1000);
}

function toggleSafeClick(toggle) {
  if (toggle) {
    for (var i = 0; i < 1; i++) {
      gGame.prevSafeClick.row = getRandomInt(0, gBoard.length);
      gGame.prevSafeClick.col = getRandomInt(0, gBoard[0].length);

      if (
        gBoard[gGame.prevSafeClick.row][gGame.prevSafeClick.col].isMine ||
        gBoard[gGame.prevSafeClick.row][gGame.prevSafeClick.col].isMarked ||
        gBoard[gGame.prevSafeClick.row][gGame.prevSafeClick.col].isShown
      ) {
        i--;
        continue;
      }
    }
  }

  var row = gGame.prevSafeClick.row;
  var col = gGame.prevSafeClick.col;
  var minesNegsCount = setMinesNegsCount(gBoard, row, col);
  var elCell = document.querySelector(`.cell-${row}-${col}`);

  if (toggle) {
    elCell.classList.remove('hidden');
    elCell.style.color = colorizeCell(minesNegsCount);
    elCell.innerHTML = minesNegsCount;
  } else {
    elCell.classList.add('hidden');
    elCell.innerHTML = '';
  }
}

function manualMode() {
  if (gGame.firstClickedCell || !gGame.isOn) return;

  gGame.isManualMode = true;
  gGame.isManuallyFinished = false;
}

function storeBoardSteps(board) {
  var boardStep = [];

  for (var i = 0; i < board.length; i++) {
    boardStep[i] = [];

    for (var j = 0; j < board.length; j++) {
      var currIsShown = board[i][j].isShown;
      var currIsMine = board[i][j].isMine;
      var currIsMarked = board[i][j].isMarked;
      var boardCell = {
        isShown: currIsShown,
        isMine: currIsMine,
        isMarked: currIsMarked,
      };

      boardStep[i][j] = boardCell;
    }
  }

  return boardStep;
}

function rollBack() {
  if (gGame.boardSteps.length <= 1 || !gGame.firstClickedCell) return;
  if (!gGame.isOn) return;

  var board = gGame.boardSteps.splice(gGame.boardSteps.length - 1, 1);

  gBoard = storeBoardSteps(board[0]);
  renderBoard(gBoard);
}
