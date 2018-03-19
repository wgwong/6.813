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

var cleanInputColor = function() {
	var candyLocation = Util.one("#candyLocation").value;

	if (candyLocation == "") {
		Util.one("#candyLocation").classList.remove("background-pink");
	}
}

//validates the input value of the text box and appropriate paints the background color and/or disables/enables the arrow buttons
var validateInput = function() {
	var candyLocation = Util.one("#candyLocation").value;

	disableAllArrowButtons(); //start off assuming we have all arrows disabled
	if (candyLocation == "") {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (candyLocation.length != 2 && candyLocation.length != 3) {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	var letterSet = new Set(letterList.slice(0, size));
	if (!letterSet.has(candyLocation[0].toLowerCase())) {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (!isNumeric(candyLocation.slice(1, Math.min(3, candyLocation.length)))) {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}

	if (!(parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) > 0 && parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) < size + 1)) {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (candyLocation.includes(".")) {
		Util.one("#candyLocation").classList.add("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	//if we've reached this point, the user has entered a valid board coordinate, but is it a swappable/valid move?

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

//validates whether we have attained a state where we have a crushable or not and appropriately enables/disables certain buttons/input on the board
var validateCrushable = function() {
	var numCrushes = rules.getCandyCrushes().length;
	if (numCrushes == 0) {
		Util.one("#crushButton").setAttribute("disabled", true);
		if (hasValidMove()) {
			Util.one("#showHintButton").removeAttribute("disabled");
		}
		Util.one("#candyLocation").removeAttribute("disabled");
		Util.one("#candyLocation").classList.add("background-pink");
		Util.one("#candyLocation").focus();
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

//removes all animations ongoing right now
var cancelAnimations = function() {
	Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")});;
	Util.all(".disappearing").forEach(function(e) {e.classList.remove("disappearing")});
	Util.all(".animate-vertical").forEach(function(e) {e.classList.remove("animate-vertical")});
	Util.all(".animate-horizontal").forEach(function(e) {e.classList.remove("animate-horizontal")});
}

//starts a new game state
var startNewGame = function() {
	rules.prepareNewGame(); //populate game board at start
	Util.one("#score-div").innerHTML = "0"; //start game score at 0 no matter what
	Util.one("#candyLocation").value = ""; //clear input box on page load and new game
	Util.one("#candyLocation").removeAttribute("disabled"); //enable candyLocation input just incase we press new game button while inputbox was disabled during long animation
	Util.one("#candyLocation").focus(); //focus should be on input box on page load and new game
	var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-light-gray');
	Util.css(Util.one("#score-label"), {"background-color": colorCode}); //reset score background color to gray (default)
	Util.css(Util.one("#score-label"), {"color": "black"});
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

		//next, create the actual board
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

			//add pulsing animation class to all relevant candies
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
			validateInput(); //call this after validCrushable because validCrushable will paint the input background red if there's no crushable
			Util.one("#candyLocation").focus(); //input location should gain focus after show hint is pressed

		});

		//add event listeners for each of the arrow/move buttons
		Util.one("#leftArrowButton").addEventListener("click", function() {
			var location = Util.one("#candyLocation").value;
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location.substring(1,location.length))-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "left") > 0) {
				Util.one("#showHintButton").setAttribute("disabled", true);
				Util.one("#candyLocation").value = "";
				Util.one("#candyLocation").setAttribute("disabled", true);
				board.flipCandies(position, board.getCandyAt(row, col-1));
			}
			Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints
			disableAllArrowButtons();
			Util.one("#candyLocation").focus();
		});

		Util.one("#rightArrowButton").addEventListener("click", function() {
			var location = Util.one("#candyLocation").value;
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location.substring(1,location.length))-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "right") > 0) {
				Util.one("#showHintButton").setAttribute("disabled", true);
				Util.one("#candyLocation").value = "";
				Util.one("#candyLocation").setAttribute("disabled", true);
				board.flipCandies(position, board.getCandyAt(row, col+1));
			}
			Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints
			disableAllArrowButtons();
			Util.one("#candyLocation").focus();
		});

		Util.one("#upArrowButton").addEventListener("click", function() {
			var location = Util.one("#candyLocation").value;
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location.substring(1,location.length))-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "up") > 0) {
				Util.one("#showHintButton").setAttribute("disabled", true);
				Util.one("#candyLocation").value = "";
				Util.one("#candyLocation").setAttribute("disabled", true);
				board.flipCandies(position, board.getCandyAt(row-1, col));
			}
			Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints
			disableAllArrowButtons();
			Util.one("#candyLocation").focus();
		});

		Util.one("#downArrowButton").addEventListener("click", function() {
			var location = Util.one("#candyLocation").value;
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location.substring(1,location.length))-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "down") > 0) {
				Util.one("#showHintButton").setAttribute("disabled", true);
				Util.one("#candyLocation").value = "";
				Util.one("#candyLocation").setAttribute("disabled", true);
				board.flipCandies(position, board.getCandyAt(row+1, col));
			}
			Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints
			disableAllArrowButtons();
			Util.one("#candyLocation").focus();
		});

		//add event listener for crushbutton; will crush and repopulate crushables
		Util.one("#crushButton").addEventListener("click", function() {
			Util.all(".pulse").forEach(function(e) {e.classList.remove("pulse")}); //remove any hints
			disableAllArrowButtons();
			Util.one("#crushButton").setAttribute("disabled", true);

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

		//create the actual image img and add it to the html
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

		//create the actual image img and add it to the html
		var candyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		var imgSrc = document.createElement("img");
		imgSrc.setAttribute("src", "graphics/" + color + "-candy.png");
		imgSrc.classList.add("candy-img");
		Util.one(candyId).innerHTML = "";
		Util.one(candyId).append(imgSrc);
	
		var imgChild = Util.one(candyId).querySelector("img");

		imgChild.style.setProperty("--speed", speedScale);
		var animationToWaitFor = "";

		//figure out which direction we're going and how far and apply the appropriate css animation/keyframes
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
			validateCrushable();
		};
		Util.afterAnimation(imgChild, animationToWaitFor).then(afterAnimationFunction, afterAnimationFunction);
	},

	// remove a candy from the board
	"remove": function(e) {
		var color = e.detail.candy.color;
		var row = e.detail.fromRow;
		var col = e.detail.fromCol;
		var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
		var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);

		//simply add the fading animation css class to the candies we will remove
		var imgChild = Util.one(candyId).querySelector("img");
		imgChild.classList.add("disappearing");

		var afterAnimationFunction = function() {
			imgChild.remove(); //remove from DOM after fade animation finishes
		};

		Util.afterAnimation(imgChild, "disappear").then(afterAnimationFunction, afterAnimationFunction);
		//shouldn't need to call validateCrushable() here since add will be called anyways to repopulate the board
	},

	// update the score
	"scoreUpdate": function(e) {
		Util.one("#score-div").innerHTML = e.detail.score;

		if (e.detail.candy != null) { //color the score if we need to update the color due to crushes
			var color = e.detail.candy.color;
			var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-'+color);
			
			//get the appropriate color scheme
			Util.css(Util.one("#score-label"), {"background-color": colorCode});
			if (color == "purple" || color == "blue" || color == "green" || color == "red") {
				Util.css(Util.one("#score-label"), {"color": "white"});
			} else {
				Util.css(Util.one("#score-label"), {"color": "black"});
			}
		}
	},
});
