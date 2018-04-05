// Hand it in this way: for simpler testing, always use the same seed.
Math.seedrandom(0);

// constants
const DEFAULT_BOARD_SIZE = 8;
// set size from URL or to default
const size = Math.min(10, Math.max(3, Util.getURLParam("size") || DEFAULT_BOARD_SIZE));
const letterMapping = {1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i', 10: 'j'}
const positionMapping = {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10}
const letterList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const millisecondsPerSecond = 1000; //conversion unit
const negative = -1;

// Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
var dom = {};

// data model at global scope for easier debugging
// initialize board model
var board = new Board(size);

// load a rule
var rules = new Rules(board);

var isNumeric = function(n) {
	return !isNaN(parseInt(n)) && isFinite(n);
}

var translatePositionToLetter = function(pos) {
	return letterMapping[pos];
}
var translateLetterToPosition = function(letter) {
	letter = letter.toLowerCase();
	return positionMapping[letter];
}

var getPositionFromInput = function(location) {
	var col = translateLetterToPosition(location[0])-1; //assuming correct format
	var row = parseInt(location.substring(1,location.length))-1; //assuming correct format
	position = board.getCandyAt(row, col);
	return position;
}

var calculateDirection = function(fromCol, fromRow, toCol, toRow) {
	if (fromCol == toCol) { //vertical
		if (fromRow < toRow) {
			return "down";
		} else {
			return "up";
		}
	} else if (fromRow == toRow){ //horizontal
		if (fromCol < toCol) {
			return "right";
		} else {
			return "left";
		}
	} else {
		return "diagonal";
	}
}

var calculateSpeed = function(fromCol, fromRow, toCol, toRow) {
	if (fromCol == null || fromRow == null || toCol == null || toRow == null) {
		return 1;
	}
	if (fromCol == toCol) { //vertical
		return Math.abs(fromRow-toRow);
	} else { //horizontal
		return Math.abs(fromCol-toCol);
	}
}

var validateCrushable = function() {
	var numCrushes = rules.getCandyCrushes().length;
	if (numCrushes == 0) {
		if (hasValidMove()) {
			Util.one("#showHintButton").removeAttribute("disabled");
		}
	} else {
		crushCandies();
		Util.one("#showHintButton").setAttribute("disabled", true);
	}
}

//check whether the board still has valid moves left
var hasValidMove = function () {
	if (rules.getRandomValidMove() == null) {
		return false;
	}

	return true;
}

var cancelAnimations = function() {
	Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")});;
	Util.all(".disappearing").forEach(function(e) {e.classList.remove("disappearing")});
	Util.all(".animate-vertical").forEach(function(e) {e.classList.remove("animate-vertical")});
	Util.all(".animate-horizontal").forEach(function(e) {e.classList.remove("animate-horizontal")});
	Util.all(".animate-diagonal").forEach(function(e) {e.classList.remove("animate-diagonal")});
}

var hasAnimationsInProgress = function() {
	var count = 0;
	count += Util.all(".disappearing").length;
	count += Util.all(".animate-vertical").length;
	count += Util.all(".animate-horizontal").length;
	count += Util.all(".animate-diagonal").length;

	return count !== 0;
}

var startNewGame = function() {
	rules.prepareNewGame(); //populate game board at start
	Util.one("#score-div").innerHTML = "0"; //start game score at 0 no matter what
	var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-light-gray');
	Util.css(Util.one("#score-label"), {"background-color": colorCode}); //reset score background color to gray (default)
	Util.css(Util.one("#score-label"), {"color": "black"});
	if (!hasValidMove()) {
		Util.one("#showHintButton").setAttribute("disabled", true);
	}
	validateCrushable();
}

var getUnderlyingCellCoordinates = function(x, y) {
	var boardRect = Util.one("#cellBoard").getBoundingClientRect();
	var topLeftRect = Util.one("#cell-a-1").getBoundingClientRect();
	var headerColumnWidth = topLeftRect.x - boardRect.x;
	var headerColumnHeight = topLeftRect.y - boardRect.y;
	var cellWidth = topLeftRect.width;
	var cellHeight = topLeftRect.height;

	var leftBound = boardRect.x + headerColumnWidth;
	var rightBound = boardRect.x + boardRect.width;
	var topBound = boardRect.y + headerColumnHeight;
	var bottomBound = boardRect.y + boardRect.height;

	if (x < leftBound || x > rightBound) {
		return false;
	}
	if (y < topBound || y > bottomBound) {
		return false;
	}

	var column = Math.floor((x - leftBound)/cellWidth);
	var row = Math.floor((y - topBound)/cellHeight);

	return [row, column];
}

//crushes and repopulates candies
var crushCandies = function () {
	Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints

	rules.removeCrushes(rules.getCandyCrushes());

	var afterAnimationFunction = function() {
		rules.moveCandiesDown();
		if (hasValidMove() && rules.getCandyCrushes().length == 0) { //enable show hint button if no valid crushes exist after crushing
			Util.one("#showHintButton").removeAttribute("disabled");
		}
	};

	//if the showhint button hasn't already been pressed while we were animating the crush, then also animate the "moving candies down"
	if (Util.all(".pulse").length > 0) {
		afterAnimationFunction();
	} else {
		var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
		Util.delay((parseFloat(durationFadeCode)*millisecondsPerSecond)).then(afterAnimationFunction, afterAnimationFunction);
	}
}

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
	// Final initalization entry point: the Javascript code inside this block
	// runs at the end of start-up when the DOM is ready
	"DOMContentLoaded": function() {
		// Your code here

		//TODO
		/*
		Util.events(document.body, {
			"mouseleave": function(evt) {
				console.log("mouse left2");
			}
		});*/

		//programmatically create the game grid in the middle
		//create the header row first
		var trTop = document.createElement("tr");
		var thTop = document.createElement("th");
		thTop.classList.add("short-height");
		trTop.append(thTop);
		for (var i = 1; i <= size; i++) {
			var td = document.createElement("td");
			td.classList.add("no-borders");
			td.classList.add("short-height");
			td.append(translatePositionToLetter(i));
			trTop.append(td);
		}
		Util.one("#cellBoard").append(trTop);

		//next create the actual board
		for (var i = 1; i <= size; i++) {
			var tr = document.createElement("tr");
			var th = document.createElement("th");
			th.classList.add("no-borders");
			th.append(i);
			tr.append(th);

			for (var j = 1; j <= size; j++) {
				var td = document.createElement("td");
				td.setAttribute("id", "cell-"+translatePositionToLetter(j)+"-"+i);
				tr.append(td);
			}
			Util.one("#cellBoard").append(tr);
		}

		startNewGame(); //start new game

		Util.one("#cellBoard").style.setProperty("--size", size);

		// Add events
		//add event listener for new game button; starts new game visually too
		Util.one("#newGameButton").addEventListener("click", function() {
			startNewGame();
		});

		//add event listener for show hint button; add css animation to cells that can be valid moves
		Util.one("#showHintButton").addEventListener("click", function() {
			var hint = rules.getRandomValidMove();
			candiesToCrush = rules.getCandiesToCrushGivenMove(hint.candy, hint.direction); //calling this private function because there's no other way to get the other crushable candies without manually checking the entire board by hand

			//remove any animations including previous hints
			cancelAnimations();

			for (var i in candiesToCrush) {
				var candyToCrush = candiesToCrush[i];
				var col = candyToCrush.col;
				var row = candyToCrush.row;
				var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);
				var children = Util.one(candyId).children;
				for (var i = 0; i < children.length; i++ ) {
					children[i].classList.add("pulse");
				};
			}
			validateCrushable();
			Util.one("#candyLocation").focus(); //input location should gain focus after show hint is pressed

		});
	},

	// Keyboard events arrive here
	"keydown": function(evt) {
		// Your code here
	},

	// Click events arrive here
	"click": function(evt) {
		// Your code here
	},

	"mousedown": function(evt) {
		var target = evt.target;
		if (target.classList.contains("candy-img") && !hasAnimationsInProgress()) {
			var startX = evt.clientX;
			var startY = evt.clientY;
			target.classList.add("draggable");
			target.style.setProperty("--x", startX);
			target.style.setProperty("--y", startY);
			target.style.setProperty("--xoffset", startX);
			target.style.setProperty("--yoffset", startY);
		}
	},

	"mouseup": function(evt) {
		var target = evt.target;
		var coordinates = getUnderlyingCellCoordinates(evt.clientX, evt.clientY);

		var returnToOriginalPosition = function() {
			var startX = parseInt(window.getComputedStyle(target).getPropertyValue('--x'));
			var startY = parseInt(window.getComputedStyle(target).getPropertyValue('--y'));
			var offsetX = parseInt(window.getComputedStyle(target).getPropertyValue('--xoffset'));
			var offsetY = parseInt(window.getComputedStyle(target).getPropertyValue('--yoffset'));
			var distanceX = offsetX - startX;
			var distanceY = offsetY - startY;

			if (distanceX + distanceY > 0) { //don't animate return if we didn't even move the candy
				target.style.setProperty("--speed", 1);
				var animationToWaitFor = "move-diagonal";
				
				target.style.setProperty("--distanceX", distanceX);
				target.style.setProperty("--distanceY", distanceY);
				target.classList.add("animate-diagonal");

				var afterAnimationFunction = function() {
					target.classList.remove("draggable");
					target.classList.remove("animate-diagonal");
				};
				Util.afterAnimation(target, animationToWaitFor).then(afterAnimationFunction, afterAnimationFunction);
			} else {
				target.classList.remove("draggable");
			}
		}

		if (coordinates !== false && !hasAnimationsInProgress()) { //if we are dragging a candy and it's above another cell
			var cellId = evt.path[1].id;
			var cellIdSplit = cellId.split("-");
			var targetCoordinates = [parseInt(cellIdSplit[2])-1, translateLetterToPosition(cellIdSplit[1])-1];
			if (!(coordinates[0] == targetCoordinates[0] && coordinates[1] == targetCoordinates[1])) {
				var direction = calculateDirection(targetCoordinates[1], targetCoordinates[0], coordinates[1], coordinates[0]);

				var candyDragging = board.getCandyAt(targetCoordinates[0], targetCoordinates[1]);
				var candyToSwap = board.getCandyAt(coordinates[0], coordinates[1]);

				var isValidMove = rules.isMoveTypeValid(candyDragging, direction);
				if (Math.abs(coordinates[0] - targetCoordinates[0] + coordinates[1] - targetCoordinates[1]) !== 1) { //moving more than 1 cell is invalid
					isValidMove = false;
				}

				if (isValidMove) {
					board.flipCandies(candyDragging, candyToSwap);
				} else { //not a legal move
					returnToOriginalPosition(); //animate return to original position for candy
				}
			} else { //same cell, do not flip
				returnToOriginalPosition(); //animate return to original position for candy
			}
		} else if (target.classList.contains("candy-img") && !hasAnimationsInProgress()) {
			returnToOriginalPosition();	//animate return to original position for candy
		}
	},

	"mousemove": function(evt) {
		evt.preventDefault(); //prevent ghost image
		var dragCandy = Util.one(".draggable");

		if (dragCandy !== null) {
			dragCandy.style.setProperty("--xoffset", evt.clientX);
			dragCandy.style.setProperty("--yoffset", evt.clientY);
		}

		/*
		console.log("xy: ", evt.x + ", " + evt.y);
		console.log("client: " + evt.clientX + ", " + evt.clientY);
		console.log("screen: " + evt.screenX + ", " + evt.screenY);
		console.log("page: " + evt.pageX + ", " + evt.pageY);
		console.log("layer: " + evt.layerX + ", " + evt.layerY);
		console.log("offset: " + evt.offsetX + ", " + evt.offsetX);
		*/
	},

	//TODO
	/*
	"mouseleave": function(evt) {
		console.log("mouse left");
	}*/
});

// Attaching events to the board
Util.events(board, {
	// add a candy to the board
	"add": function(e) {
		var color = e.detail.candy.color;
		var toCol = e.detail.toCol;
		var toRow = e.detail.toRow;
		var fromCol = e.detail.fromCol;
		var fromRow = e.detail.fromRow;

		var candyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		var imgSrc = document.createElement("img");
		imgSrc.setAttribute("src", "graphics/" + color + "-candy.png");
		imgSrc.classList.add("candy-img");
		Util.one(candyId).innerHTML = "";
		Util.one(candyId).append(imgSrc);

		if (fromCol != null && fromRow != null) { //only animate add if not populating board at start/new game
			var speedScale = calculateSpeed(fromCol, fromRow, toCol, toRow);
			var heightToDrop = negative * 100 * (toRow - fromRow);

			var imgChild = Util.one(candyId).querySelector("img");

			imgChild.style.setProperty("--speed", speedScale);
			imgChild.style.setProperty("--distance", heightToDrop);
			imgChild.classList.add("animate-vertical");

			var afterAnimationFunction = function() {
				imgChild.classList.remove("animate-vertical");
				validateCrushable();
			};
			Util.afterAnimation(imgChild, "move-vertical").then(afterAnimationFunction, afterAnimationFunction);
		}
	},

	// move a candy from location 1 to location 2
	"move": function(e) {
		var color = e.detail.candy.color;
		var toCol = e.detail.toCol;
		var toRow = e.detail.toRow;
		var fromCol = e.detail.fromCol;
		var fromRow = e.detail.fromRow;
		var direction = calculateDirection(fromCol, fromRow, toCol, toRow);
		var speedScale = calculateSpeed(fromCol, fromRow, toCol, toRow);

		var candyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		var imgChild = document.createElement("img");
		imgChild.setAttribute("src", "graphics/" + color + "-candy.png");
		imgChild.classList.add("candy-img");

		//check if draggable
		var isDraggable = false;
		var candyFromId = "#cell-"+translatePositionToLetter(fromCol+1)+"-"+(fromRow+1);
		var imgChildren = Util.one(candyFromId).children;

		var imgFromChild = null;
		for (var i = 0; i < imgChildren.length; i++) {
			imgFromChild = imgChildren[i];
			if (imgFromChild.classList.contains("draggable")) {
				isDraggable = true;
				break;
			}
		}

		//if candy is dragged by mouse, use different animation and start from where the cursor drops the candy
		if (isDraggable) {
			var endX = parseInt(window.getComputedStyle(imgFromChild).getPropertyValue('--x'));
			var endY = parseInt(window.getComputedStyle(imgFromChild).getPropertyValue('--y'));
			var offsetX = parseInt(window.getComputedStyle(imgFromChild).getPropertyValue('--xoffset'));
			var offsetY = parseInt(window.getComputedStyle(imgFromChild).getPropertyValue('--yoffset'));

			var cellSize = parseInt(window.getComputedStyle(Util.one(candyFromId)).getPropertyValue('width').split("px")[0]);

			if (direction == "up") {
				endY -= cellSize;
			}
			if (direction == "down") {
				endY += cellSize;
			}
			if (direction == "left") {
				endX -= cellSize;
			}
			if (direction == "right") {
				endX += cellSize;
			}


			Util.one(candyId).innerHTML = "";
			Util.one(candyId).append(imgChild);

			imgChild.style.setProperty("--speed", speedScale);
			var animationToWaitFor = "move-diagonal";

			var distanceX = offsetX - endX;
			var distanceY = offsetY - endY;
			imgChild.style.setProperty("--distanceX", distanceX);
			imgChild.style.setProperty("--distanceY", distanceY);
			imgChild.classList.add("animate-diagonal");

			var afterAnimationFunction = function() {
				imgChild.classList.remove("animate-diagonal");
				validateCrushable();
			};
			Util.afterAnimation(imgChild, animationToWaitFor).then(afterAnimationFunction, afterAnimationFunction);
		} else {
			Util.one(candyId).innerHTML = "";
			Util.one(candyId).append(imgChild);
		

			imgChild.style.setProperty("--speed", speedScale);
			var animationToWaitFor = "";
			if (direction == "up") {
				var distance = 100 * Math.abs(toRow - fromRow);
				imgChild.style.setProperty("--distance", distance);
				imgChild.classList.add("animate-vertical");
				animationToWaitFor = "move-vertical";
			}
			if (direction == "down") {
				var distance = 100 * Math.abs(toRow - fromRow);
				imgChild.style.setProperty("--distance", negative * distance);
				imgChild.classList.add("animate-vertical");
				animationToWaitFor = "move-vertical";
			}
			if (direction == "left") {
				var distance = 100 * Math.abs(toCol - fromCol);
				imgChild.style.setProperty("--distance", distance);
				imgChild.classList.add("animate-horizontal");
				animationToWaitFor = "move-horizontal";
			}
			if (direction == "right") {
				var distance = 100 * Math.abs(toCol - fromCol);
				imgChild.style.setProperty("--distance", negative * distance);
				imgChild.classList.add("animate-horizontal");
				animationToWaitFor = "move-horizontal";
			}

			var afterAnimationFunction = function() {
				imgChild.classList.remove("animate-vertical");
				imgChild.classList.remove("animate-horizontal");
				validateCrushable();
			};
			Util.afterAnimation(imgChild, animationToWaitFor).then(afterAnimationFunction, afterAnimationFunction);
		}
	},

	// remove a candy from the board
	"remove": function(e) {
		var color = e.detail.candy.color;
		var row = e.detail.fromRow;
		var col = e.detail.fromCol;
		var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
		var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);

		var imgChild = Util.one(candyId).querySelector("img");

		imgChild.classList.add("disappearing");

		var afterAnimationFunction = function() {
			imgChild.remove();
		};

		Util.afterAnimation(imgChild, "disappear").then(afterAnimationFunction, afterAnimationFunction);
		//shouldn't need to call validateCrushable() here since add will be called anyways to repopulate the board
	},

	// update the score
	"scoreUpdate": function(e) {
		//get the appropriate color scheme
		Util.one("#score-div").innerHTML = e.detail.score;

		if (e.detail.candy != null) {
			var color = e.detail.candy.color;
			var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-'+color);
			
			Util.css(Util.one("#score-label"), {"background-color": colorCode});
			if (color == "purple" || color == "blue" || color == "green" || color == "red") {
				Util.css(Util.one("#score-label"), {"color": "white"});
			} else {
				Util.css(Util.one("#score-label"), {"color": "black"});
			}
		}
	},
});
