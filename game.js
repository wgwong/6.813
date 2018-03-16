//TODO use only jquery OR Util (be consistent)
//TODO for game.css, make classes for things that I'm modifying by identifying by ID
//	also cleanup my media queries (esp the small one)

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

// Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
var dom = {};

// data model at global scope for easier debugging
// initialize board model
var board = new Board(size);

// load a rule
var rules = new Rules(board);

var animationsInProgress = [];

var translatePositionToLetter = function(pos) {
	return letterMapping[pos];
}
var translateLetterToPosition = function(letter) {
	letter = letter.toLowerCase();
	return positionMapping[letter];
}

var getPositionFromInput = function(location) {
	var col = translateLetterToPosition(location[0])-1; //assuming correct format
	var row = parseInt(location[1])-1; //assuming correct format
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
	} else { //horizontal
		if (fromCol < toCol) {
			return "right";
		} else {
			return "left";
		}
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

var disableAllArrowButtons = function() {
	Util.one("#leftArrowButton").setAttribute("disabled", true);
	Util.one("#rightArrowButton").setAttribute("disabled", true);
	Util.one("#upArrowButton").setAttribute("disabled", true);
	Util.one("#downArrowButton").setAttribute("disabled", true);
}

var validateInput = function() {
	var candyLocation = $("#candyLocation").val();

	if (candyLocation == "") {
		disableAllArrowButtons();
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (candyLocation.length != 2 && candyLocation.length != 3) {
		disableAllArrowButtons();
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	var letterSet = new Set(letterList.slice(0, size));
	if (!letterSet.has(candyLocation[0].toLowerCase())) {
		disableAllArrowButtons();
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (!$.isNumeric(candyLocation.slice(1, Math.min(3, candyLocation.length)))) {
		disableAllArrowButtons();
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}

	if (!(parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) > 0 && parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) < size + 1)) {
		disableAllArrowButtons();
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	var position = getPositionFromInput(candyLocation);

	var leftValid = rules.isMoveTypeValid(position, "left") > 0;
	var rightValid = rules.isMoveTypeValid(position, "right") > 0;
	var upValid = rules.isMoveTypeValid(position, "up") > 0;
	var downValid = rules.isMoveTypeValid(position, "down") > 0;

	if (leftValid) {
		Util.one("#leftArrowButton").removeAttribute("disabled");
	}
	if (rightValid) {
		Util.one("#rightArrowButton").removeAttribute("disabled");
	}
	if (upValid) {
		Util.one("#upArrowButton").removeAttribute("disabled");
	}
	if (downValid) {
		Util.one("#downArrowButton").removeAttribute("disabled");
	}
	
	if (leftValid || rightValid || upValid || downValid) {
		Util.one("#candyLocation").classList.remove("background-pink"); //remove invalid background color only if it's a valid move
	}
}

var validateCrushable = function() {
	var numCrushes = rules.getCandyCrushes().length;
	if (numCrushes == 0) {
		Util.one("#crushButton").setAttribute("disabled", true);
		if (hasValidMove()) {
			Util.one("#showHintButton").removeAttribute("disabled");
		}
		Util.one("#candyLocation").removeAttribute("disabled");
		Util.one("#candyLocation").classList.add("background-pink");
		$("#candyLocation").focus();
	} else {
		disableAllArrowButtons();
		Util.one("#crushButton").removeAttribute("disabled");
		Util.one("#showHintButton").setAttribute("disabled", true);
		Util.one("#candyLocation").setAttribute("disabled", true);
		Util.one("#candyLocation").classList.remove("background-pink");
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
	animationsInProgress.forEach(function(a) {
		a.cancel();
	});
	animationsInProgress = [];
}

var startNewGame = function() {
	rules.prepareNewGame(); //populate game board at start
	Util.one("#score-div").innerHTML = "0"; //start game score at 0 no matter what
	Util.one("#candyLocation").classList.add("background-pink"); //"invalid input" at start, so color background appropriately
	$("#candyLocation").val(''); //clear input box on page load and new game
	Util.one("#candyLocation").removeAttribute("disabled"); //enable candyLocation input just incase we press new game button while inputbox was disabled during long animation
	$("#candyLocation").focus(); //focus should be on input box on page load and new game
	var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-light-gray');
	$("#score-label").css("background-color", colorCode); //reset score background color to gray (default)
	$("#score-label").css("color", "black");
	if (!hasValidMove()) {
		Util.one("#showHintButton").setAttribute("disabled", true);
	}
	//disable all input buttons just in case we press new game button while they were active
	disableAllArrowButtons();
	validateCrushable();
}

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
	// Final initalization entry point: the Javascript code inside this block
	// runs at the end of start-up when the DOM is ready
	"DOMContentLoaded": function() {
		// Your code here

		//programmatically create the game grid in the middle
		//create the header row first
		var headerRowHTML = "<tr><th class='short-height'></th>";
		for (var i = 1; i <= size; i++) {
			headerRowHTML += "<td class='no-borders short-height'>" + translatePositionToLetter(i) + "</td>";
		}
		headerRowHTML += "</tr>";
		$("#cellBoard").append(headerRowHTML);

		//next create the actual board
		for (var i = 1; i <= size; i++) {
			var rowHTML = "";

			rowHTML += "<tr><th class='no-borders'>"+i+"</td>";
			for (var j = 1; j <= size; j++) {
				rowHTML += "<td id=cell-"+translatePositionToLetter(j)+"-"+i+"></td>";
			}
			rowHTML += "</tr>";
			$("#cellBoard").append(rowHTML);
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

			//remove any previous hints
			$(".pulse").removeClass("pulse");
			//remove any animations at all
			cancelAnimations();

			for (var i in candiesToCrush) {
				var candyToCrush = candiesToCrush[i];
				var col = candyToCrush.col;
				var row = candyToCrush.row;
				var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);
				var children = $(candyId).children();

				children.addClass("pulse");
			}
			validateCrushable();
			$("#candyLocation").focus(); //input location should gain focus after show hint is pressed

		});

		//add event listeners for each of the arrow/move buttons
		Util.one("#leftArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "left") > 0) {
				$("#showHintButton").prop("disabled", true);
				$("#candyLocation").val('');
				$("#candyLocation").prop("disabled", true);
				board.flipCandies(position, board.getCandyAt(row, col-1));
			}
			$(".pulse").removeClass("pulse"); //remove any hints
			disableAllArrowButtons();
			$("#candyLocation").focus();
		});

		Util.one("#rightArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "right") > 0) {
				$("#showHintButton").prop("disabled", true);
				$("#candyLocation").val('');
				$("#candyLocation").prop("disabled", true);
				board.flipCandies(position, board.getCandyAt(row, col+1));
			}
			$(".pulse").removeClass("pulse"); //remove any hints
			disableAllArrowButtons();
			$("#candyLocation").focus();
		});

		Util.one("#upArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "up") > 0) {
				$("#showHintButton").prop("disabled", true);
				$("#candyLocation").val('');
				$("#candyLocation").prop("disabled", true);
				board.flipCandies(position, board.getCandyAt(row-1, col));
			}
			$(".pulse").removeClass("pulse"); //remove any hints
			disableAllArrowButtons();
			$("#candyLocation").focus();
		});

		Util.one("#downArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "down") > 0) {
				$("#showHintButton").prop("disabled", true);
				$("#candyLocation").val('');
				$("#candyLocation").prop("disabled", true);
				board.flipCandies(position, board.getCandyAt(row+1, col));
			}
			$(".pulse").removeClass("pulse"); //remove any hints
			disableAllArrowButtons();
			$("#candyLocation").focus();
		});

		//add event listener for crushbutton; will crush and repopulate crushables
		Util.one("#crushButton").addEventListener("click", function() {
			$(".pulse").removeClass("pulse"); //remove any hints
			disableAllArrowButtons();
			$("#crushButton").prop("disabled", true);

			rules.removeCrushes(rules.getCandyCrushes());
			if (hasValidMove()) { //enable showhint button if valid crushes exist after crushing
				Util.one("#showHintButton").removeAttribute("disabled");
			}

			var afterAnimationFunction = function() {
				rules.moveCandiesDown();
			};

			var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
			Util.delay((parseFloat(durationFadeCode)*millisecondsPerSecond)).then(afterAnimationFunction, afterAnimationFunction);
		});
	},

	// Keyboard events arrive here
	"keydown": function(evt) {
		// Your code here
	},

	// Click events arrive here
	"click": function(evt) {
		// Your code here
	}
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
		$(candyId).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");

		if (fromCol != null && fromRow != null) { //only animate add if not populating board at start/new game
			var direction = calculateDirection(fromCol, fromRow, toCol, toRow);
			var speedScale = calculateSpeed(fromCol, fromRow, toCol, toRow);
			var durationMoveCode = window.getComputedStyle(document.body).getPropertyValue('--duration-move');
			var speed = Math.round(parseFloat(durationMoveCode) * speedScale * millisecondsPerSecond);

			var imgChild = Util.one(candyId).querySelector("img");

			var heightToDrop = 100 * (toRow - fromRow);

			var keyframes = {
				transform: ['translateY(-' + heightToDrop + '%)', 'translateY(0%)']
			}

			var afterAnimationFunction = function() {
				validateCrushable();
			};
			var animation = imgChild.animate(keyframes, speed);
			animation.onfinish = afterAnimationFunction;
			animationsInProgress.push(animation);
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
		var durationMoveCode = window.getComputedStyle(document.body).getPropertyValue('--duration-move');
		var speed = Math.round(parseFloat(durationMoveCode) * speedScale * millisecondsPerSecond);

		var candyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		$(candyId).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");
	
		var imgChild = Util.one(candyId).querySelector("img");

		var keyframes = {
			transform: []
		}

		if (direction == "up") {
			var distance = 100 * Math.abs(toRow - fromRow);
			keyframes["transform"].push('translateY(' + distance + '%)');
			keyframes["transform"].push('translateY(0%)');
		}
		if (direction == "down") {
			var distance = 100 * Math.abs(toRow - fromRow);
			keyframes["transform"].push('translateY(-' + distance + '%)');
			keyframes["transform"].push('translateY(0%)');
		}
		if (direction == "left") {
			var distance = 100 * Math.abs(toCol - fromCol);
			keyframes["transform"].push('translateX(' + distance + '%)');
			keyframes["transform"].push('translateX(0%)');
		}
		if (direction == "right") {
			var distance = 100 * Math.abs(toCol - fromCol);
			keyframes["transform"].push('translateX(-' + distance + '%)');
			keyframes["transform"].push('translateX(0%)');
		}

		var afterAnimationFunction = function() {
			validateCrushable();
		};
		var animation = imgChild.animate(keyframes, speed);
		animation.onfinish = afterAnimationFunction;
		
	},

	// remove a candy from the board
	"remove": function(e) {
		var color = e.detail.candy.color;
		var row = e.detail.fromRow;
		var col = e.detail.fromCol;
		var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
		var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);

		var imgChild = Util.one(candyId).querySelector("img");
		var styles = {
			animation: "disappear" + durationFadeCode + " 1"
		};
		Util.css(imgChild, styles);

		var afterAnimationFunction = function() {
			$(candyId).empty();
		};

		

		Util.afterAnimation(Util.one(candyId).querySelector("img"), "disappear").then(afterAnimationFunction, afterAnimationFunction);
		//shouldn't need to call validateCrushable() here since add will be called anyways to repopulate the board
	},

	// update the score
	"scoreUpdate": function(e) {
		//get the appropriate color scheme
		$("#score-div").text(e.detail.score);

		if (e.detail.candy != null) {
			var color = e.detail.candy.color;
			var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-'+color);
			
			$("#score-label").css("background-color", colorCode);
			if (color == "purple" || color == "blue" || color == "green" || color == "red") {
				$("#score-label").css("color", "white");
			} else {
				$("#score-label").css("color", "black");
			}
		}
	},
});
