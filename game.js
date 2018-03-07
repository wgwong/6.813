// Hand it in this way: for simpler testing, always use the same seed.
Math.seedrandom(0);

// constants
const DEFAULT_BOARD_SIZE = 8;
// set size from URL or to default
const size = Math.min(10, Math.max(3, Util.getURLParam("size") || DEFAULT_BOARD_SIZE));
const letterMapping = {1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'h'}
const positionMapping = {'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8}

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

var disableAllArrowButtons = function() {
	$("#leftArrowButton").prop("disabled", true);
	$("#rightArrowButton").prop("disabled", true);
	$("#upArrowButton").prop("disabled", true);
	$("#downArrowButton").prop("disabled", true);
}

var validateInput = function() {
	var location = $("#candyLocation").val();
	if (location == "") {
		disableAllArrowButtons();
		return;
	}
	if (location.length != 2) {
		disableAllArrowButtons();
		return;
	}
	if (!"abcdefgh".includes(location[0].toLowerCase())) {
		disableAllArrowButtons();
		return;
	}
	if (!$.isNumeric(location[1])) {
		disableAllArrowButtons();
		return;
	}
	if (!(parseInt(location[1]) > 0 && parseInt(location[1]) < 9)) {
		disableAllArrowButtons();
		return;
	}

	$("#leftArrowButton").prop("disabled", false);
	$("#rightArrowButton").prop("disabled", false);
	$("#upArrowButton").prop("disabled", false);
	$("#downArrowButton").prop("disabled", false);
}

var validateCrushable = function() {
	var numCrushes = rules.getCandyCrushes().length;
	if (numCrushes == 0) {
		$("#crushButton").prop("disabled", true);
		$("#candyLocation").prop("disabled", false);
	} else {
		$("#crushButton").prop("disabled", false);
		disableAllArrowButtons();
		$("#candyLocation").prop("disabled", true);
	}
}

// Attaching events on document because then we can do it without waiting for
// the DOM to be ready (i.e. before DOMContentLoaded fires)
Util.events(document, {
	// Final initalization entry point: the Javascript code inside this block
	// runs at the end of start-up when the DOM is ready
	"DOMContentLoaded": function() {
		// Your code here
		var table_width = 8;
		var table_height = 8;

		for (var i = 1; i <= table_height; i++) {
			$("#cellBoard").append("<div class='grid-row-header'>"+i+"</div>");
			for (var j = 1; j <= table_width; j++) {
				$("#cellBoard").append("<div id=cell-"+translatePositionToLetter(j)+"-"+i+" class='grid-item'></div>");
			}
		}

		rules.prepareNewGame(); //populate game board at start

		// Add events
		Util.one("#newGameButton").addEventListener("click", function() {
			rules.prepareNewGame();
		});

		Util.one("#leftArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format
			position = board.getCandyAt(row, col);

			if (rules.isMoveTypeValid(position, "left") > 0) {
				board.flipCandies(position, board.getCandyAt(row, col-1));
			}
			disableAllArrowButtons();
			$("#candyLocation").focus();
			$("#candyLocation").val('');
		});

		Util.one("#rightArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format
			position = board.getCandyAt(row, col);

			if (rules.isMoveTypeValid(position, "right") > 0) {
				board.flipCandies(position, board.getCandyAt(row, col+1));
			}
			disableAllArrowButtons();
			$("#candyLocation").focus();
			$("#candyLocation").val('');
		});

		Util.one("#upArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format
			position = board.getCandyAt(row, col);

			if (rules.isMoveTypeValid(position, "up") > 0) {
				board.flipCandies(position, board.getCandyAt(row-1, col));
			}
			disableAllArrowButtons();
			$("#candyLocation").focus();
			$("#candyLocation").val('');
		});

		Util.one("#downArrowButton").addEventListener("click", function() {
			var location = $("#candyLocation").val();
			var col = translateLetterToPosition(location[0])-1; //assuming correct format
			var row = parseInt(location[1])-1; //assuming correct format
			position = board.getCandyAt(row, col);

			if (rules.isMoveTypeValid(position, "down") > 0) {
				board.flipCandies(position, board.getCandyAt(row+1, col));
			}
			disableAllArrowButtons();
			$("#candyLocation").focus();
			$("#candyLocation").val('');
		});

		Util.one("#crushButton").addEventListener("click", function() {
			disableAllArrowButtons();
			rules.removeCrushes(rules.getCandyCrushes());
			setTimeout(() => rules.moveCandiesDown(), 500);
			
			$("#candyLocation").focus();
			$("#candyLocation").val('');
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
		var row = e.detail.candy.row;
		var col = e.detail.candy.col;
		$("#cell-"+translatePositionToLetter(col+1)+"-"+(row+1)).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");
		validateCrushable();
	},

	// move a candy from location 1 to location 2
	"move": function(e) {
		var color = e.detail.candy.color;
		var toCol = e.detail.toCol;
		var toRow = e.detail.toRow;
		$("#cell-"+translatePositionToLetter(toCol+1)+"-"+(toRow+1)).empty().append("<img src='graphics/" + color + "-candy.png' class='candy-img'>");
		validateCrushable();
	},

	// remove a candy from the board
	"remove": function(e) {
		var color = e.detail.candy.color;
		var row = e.detail.fromRow;
		var col = e.detail.fromCol;
		$("#cell-"+translatePositionToLetter(col+1)+"-"+(row+1)).empty();
		//shouldn't need to call validateCrushable() here since add will be called anyways to repopulate the board
	},

	// update the score
	"scoreUpdate": function(e) {
		// Your code here. To be implemented in PS3.
	},
});
