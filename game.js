// Hand it in this way: for simpler testing, always use the same seed.
Math.seedrandom(0);

// constants
const DEFAULT_BOARD_SIZE = 8;
// set size from URL or to default
const size = Math.min(10, Math.max(3, Util.getURLParam("size") || DEFAULT_BOARD_SIZE));
const letterMapping = {1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h', 9: 'i', 10: 'j'}
const positionMapping = {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9, 'j': 10}
//const colorMapping = {"red": ,"yellow": ,"green": ,"orange": ,"blue": ,"purple": } //debug

// Holds DOM elements that don’t change, to avoid repeatedly querying the DOM
var dom = {};

// data model at global scope for easier debugging
// initialize board model
var board = new Board(size);

// load a rule
var rules = new Rules(board);

var translatePositionToLetter = function(pos) {
	return letterMapping[pos];
}
var translateLetterToPosition = function(letter) {
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
	if (fromCol == toCol) { //vertical
		return Math.abs(fromRow-toRow);
	} else { //horizontal
		return Math.abs(fromCol-toCol);
	}
}

var disableAllArrowButtons = function() {
	$("#leftArrowButton").prop("disabled", true);
	$("#rightArrowButton").prop("disabled", true);
	$("#upArrowButton").prop("disabled", true);
	$("#downArrowButton").prop("disabled", true);
}

var validateInput = function() {
	var candyLocation = $("#candyLocation").val();

	if (candyLocation == "") {
		disableAllArrowButtons();
		$("#candyLocation").addClass("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (candyLocation.length != 2 && candyLocation.length != 3) {
		disableAllArrowButtons();
		$("#candyLocation").addClass("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (!"abcdefgh".includes(candyLocation[0].toLowerCase())) {
		disableAllArrowButtons();
		$("#candyLocation").addClass("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	if (!$.isNumeric(candyLocation.slice(1, Math.min(3, candyLocation.length)))) {
		disableAllArrowButtons();
		$("#candyLocation").addClass("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}

	if (!(parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) > 0 && parseInt(candyLocation.slice(1, Math.min(3, candyLocation.length))) < size + 1)) {
		disableAllArrowButtons();
		$("#candyLocation").addClass("background-pink"); //give invalid background color to indicate invalid location input
		return;
	}
	//if we've made it this far, then the input must be valid right?
	$("#candyLocation").removeClass("background-pink"); //remove invalid background color

	var position = getPositionFromInput(candyLocation);

	if (rules.isMoveTypeValid(position, "left") > 0) {
		$("#leftArrowButton").prop("disabled", false);
	}
	if (rules.isMoveTypeValid(position, "right") > 0) {
		$("#rightArrowButton").prop("disabled", false);
	}
	if (rules.isMoveTypeValid(position, "up") > 0) {
		$("#upArrowButton").prop("disabled", false);
	}
	if (rules.isMoveTypeValid(position, "down") > 0) {
		$("#downArrowButton").prop("disabled", false);
	}
}

var validateCrushable = function() {
	var numCrushes = rules.getCandyCrushes().length;
	if (numCrushes == 0) {
		$("#crushButton").prop("disabled", true);
		$("#candyLocation").prop("disabled", false);
		$("#candyLocation").addClass("background-pink");
	} else {
		disableAllArrowButtons();
		$("#crushButton").prop("disabled", false);
		$("#candyLocation").prop("disabled", true);
		$("#candyLocation").removeClass("background-pink");
	}
}

var startNewGame = function() {
	rules.prepareNewGame(); //populate game board at start
	$("#score-div").text("0"); //start game score at 0 no matter what
	$("#candyLocation").addClass("background-pink"); //"invalid input" at start, so color background appropriately
	$("#candyLocation").val(''); //clear input box on page load and new game
	$("#candyLocation").focus(); //focus should be on input box on page load and new game
	var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-light-gray');
	$("#score-label").css("background-color", colorCode); //reset score background color to gray (default)
	$("#score-label").css("color", "black");
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
		var headerRowHTML = "<tr><th></th>";
		for (var i = 1; i <= size; i++) {
			headerRowHTML += "<th>" + translatePositionToLetter(i) + "</th>";
		}
		headerRowHTML += "</tr>";
		$("#cellBoard").append(headerRowHTML);

		//next create the actual board
		for (var i = 1; i <= size; i++) {
			var rowHTML = "";
			rowHTML += "<tr><td class='no-borders'>"+i+"</td>";
			for (var j = 1; j <= size; j++) {
				rowHTML += "<td id=cell-"+translatePositionToLetter(j)+"-"+i+"></td>";
			}
			rowHTML += "</tr>";
			$("#cellBoard").append(rowHTML);
		}

		startNewGame(); //start new game
		
		// Add events
		//add event listener for new game button; starts new game visually too
		Util.one("#newGameButton").addEventListener("click", function() {
			startNewGame();
		});

		//add event listener for show hint button; add css animation to cells that can be valid moves
		Util.one("#showHintButton").addEventListener("click", function() {
			var hint = rules.getRandomValidMove();
			candiesToCrush = rules.getCandiesToCrushGivenMove(hint.candy, hint.direction);

			//remove any previous hints
			$(".pulse").removeClass("pulse");

			for (var i in candiesToCrush) {
				var candyToCrush = candiesToCrush[i];
				var col = candyToCrush.col;
				var row = candyToCrush.row;
				var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);
				var children = $(candyId).children();

				children.addClass("pulse");
				console.log("child: ", children);
				//$(candyId).addClass("pulse");
			}

		});

		//add event listeners for each of the arrow/move buttons
		Util.one("#leftArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var position = getPositionFromInput(location);
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format

			if (rules.isMoveTypeValid(position, "left") > 0) {
				board.flipCandies(position, board.getCandyAt(row, col-1));
				$("#candyLocation").val('');
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
				board.flipCandies(position, board.getCandyAt(row, col+1));
				$("#candyLocation").val('');
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
				board.flipCandies(position, board.getCandyAt(row-1, col));
				$("#candyLocation").val('');
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
				board.flipCandies(position, board.getCandyAt(row+1, col));
				$("#candyLocation").val('');
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
			setTimeout(() => {
				rules.moveCandiesDown();
				$("#candyLocation").focus();
				$("#candyLocation").val('');
			}, 500);
		});

		//disable focus ring on button press
		var buttonList = Util.all("button");
		for (var i in buttonList){
			var button = buttonList[i];
			button.addEventListener("mouseup", function() {
				this.blur();
			});
		}
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
		console.log("adding candy. e.detail: ", e.detail); 
		var direction = calculateDirection(fromCol, fromRow, toCol, toRow);
		var speed = calculateSpeed(fromCol, fromRow, toCol, toRow);
		var durationMoveCode = window.getComputedStyle(document.body).getPropertyValue('--duration-move');

		var candyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		$(candyId).css("animation", (parseFloat(durationMoveCode) * speed) + " move-" + direction + " 1");

		var populateCandy = function() {
			$(candyId).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");
			validateCrushable();
		}

		Util.afterAnimation(Util.one(candyId), "move-" + direction).then(populateCandy(), populateCandy());
	},

	// move a candy from location 1 to location 2
	"move": function(e) {
		var color = e.detail.candy.color;
		var toCol = e.detail.toCol;
		var toRow = e.detail.toRow;
		var fromCol = e.detail.fromCol;
		var fromRow = e.detail.fromRow;
		console.log("moving candy. e.detail: ", e.detail);
		var direction = calculateDirection(fromCol, fromRow, toCol, toRow);
		var speed = calculateSpeed(fromCol, fromRow, toCol, toRow);
		var oldCandyId = "#cell-"+translatePositionToLetter(fromCol+1)+"-"+(fromRow+1);
		var newCandyId = "#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1);
		var durationMoveCode = window.getComputedStyle(document.body).getPropertyValue('--duration-move');

		$(oldCandyId).css("animation", (parseFloat(durationMoveCode) * speed) + " move-" + direction + " 1");

		var replaceCandy = function() {
			$(newCandyId).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");
			validateCrushable();
		}

		Util.afterAnimation(Util.one(oldCandyId), "move-" + direction).then(replaceCandy(), replaceCandy());
	},

	// remove a candy from the board
	"remove": function(e) {
		var color = e.detail.candy.color;
		var row = e.detail.fromRow;
		var col = e.detail.fromCol;
		var durationFadeCode = window.getComputedStyle(document.body).getPropertyValue('--duration-fade');
		var candyId = "#cell-"+translatePositionToLetter(col+1)+"-"+(row+1);

		$(candyId).css("animation", durationFadeCode + " disappear 1");

		Util.afterAnimation(Util.one(candyId), "disappear").then($(candyId).empty(), $(candyId).empty());
		//shouldn't need to call validateCrushable() here since add will be called anyways to repopulate the board
	},

	// update the score
	"scoreUpdate": function(e) {
		//get the appropriate color scheme
		var color = e.detail.candy.color;
		var colorCode = window.getComputedStyle(document.body).getPropertyValue('--color-'+color);

		$("#score-div").text(e.detail.score);
		$("#score-label").css("background-color", colorCode);
		if (color == "purple" || color == "blue" || color == "green" || color == "red") {
			$("#score-label").css("color", "white");
		} else {
			$("#score-label").css("color", "black");
		}
	},
});
