// "Crappy PONG" -- step by step
//
// Step 9: Homework
/*

* Make the ball bounce off the left and right 
  edges of the playfield, instead of "resetting".
  
* Add a scoring system! When the ball hits the
  left edge, the right paddle earns a point, and
  vice versa. Display each paddle's score, in
  "bold 40px Arial", at the top of the playfield 

* Prevent the paddles from moving out of the
  playfield, by having them "collide" with it.
  
* Let the user also move the paddles horizontally
  i.e. left and right within 100 pixels of the edges,
  using the 'A' and 'D' keys for the left paddle,
  and	  the 'J' and 'L' keys for the right paddle
  
* Add a second ball, with half the velocity 
  of the first one.

*/

"use strict";

/* jshint browser: true, devel: true, globalstrict: true */

var g_canvas;
var g_ctx;

//keep track of scores
var score = {
	p1: 0,
	p2: 0
};

//various constants
var FIELD_UPPER_BOUND = 35;
var SCORE_OFFSET = 100;

/*
0			1			 2			  3			4			 5			  6			7			 8			  9
123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
*/

// =================
// KEYBOARD HANDLING
// =================

var g_keys = [];

function handleKeydown(evt) {
	g_keys[evt.keyCode] = true;
}

function handleKeyup(evt) {
	 g_keys[evt.keyCode] = false;
}

// Inspects, and then clears, a key's state
//
// This allows a keypress to be "one-shot" e.g. for toggles
// ..until the auto-repeat kicks in, that is.
//
function eatKey(keyCode) {
	 var isDown = g_keys[keyCode];
	 g_keys[keyCode] = false;
	 return isDown;
}

window.addEventListener("keydown", handleKeydown);
window.addEventListener("keyup", handleKeyup);

// ============
// PADDLE STUFF
// ============

// COMMON PADDLE STUFF

// A generic contructor which accepts an arbitrary descriptor object
function Paddle(descr) {
	 for (var property in descr) {
		  this[property] = descr[property];
	 }
}

// Add these properties to the prototype, where they will serve as
// shared defaults, in the absence of an instance-specific overrides.

Paddle.prototype.halfWidth = 10;
Paddle.prototype.halfHeight = 50;

Paddle.prototype.update = function () {
	if (g_keys[this.GO_UP]) {
		if (this.cy - this.halfHeight - 5 >= FIELD_UPPER_BOUND) {
			this.cy -= 5;
		}
	}
	else if (g_keys[this.GO_DOWN]) {
		if (this.cy + this.halfHeight + 5 < g_canvas.height) {
			this.cy += 5;
		}
	}
	else if (g_keys[this.GO_RIGHT]) {
		//are we left or right?
		var left = this.cx < g_canvas.width / 2;

		if (left) {
			var maxX = 100;
			if (this.cx + this.halfWidth + 5 < maxX) {
				this.cx += 5;
			}
		}
		else {
			var maxX = g_canvas.width - 100;

			if (this.cx + this.halfWidth + 5 < g_canvas.width) {
				this.cx += 5;
			}
		}
	}
	else if (g_keys[this.GO_LEFT]) {
		//are we left or right?
		var left = this.cx < g_canvas.width / 2;

		if (left) {
			var maxX = 100;
			if (this.cx - this.halfWidth - 5 > 0) {
				this.cx -= 5;
			}
		}
		else {
			var maxX = g_canvas.width - 100;

			if (this.cx - this.halfWidth - 5 > maxX) {
				this.cx -= 5;
			}
		}
	}
};

Paddle.prototype.render = function (ctx) {
	 // (cx, cy) is the centre; must offset it for drawing
	 ctx.fillRect(this.cx - this.halfWidth,
					  this.cy - this.halfHeight,
					  this.halfWidth * 2,
					  this.halfHeight * 2);
};

Paddle.prototype.collidesWith = function (prevX, prevY, 
														nextX, nextY, 
														r) {
	 var paddleEdge = this.cx;
	 // Check X coords
	 if ((nextX - r < paddleEdge && prevX - r >= paddleEdge) ||
		  (nextX + r > paddleEdge && prevX + r <= paddleEdge)) {
		  // Check Y coords
		  if (nextY + r >= this.cy - this.halfHeight &&
				nextY - r <= this.cy + this.halfHeight) {
				// It's a hit!
				return true;
		  }
	 }
	 // It's a miss!
	 return false;
};

// PADDLE 1

var KEY_W = 'W'.charCodeAt(0);
var KEY_S = 'S'.charCodeAt(0);
var KEY_A = 'A'.charCodeAt(0);
var KEY_D = 'D'.charCodeAt(0);

var g_paddle1 = new Paddle({
	cx : 30,
	cy : 100,
	
	GO_UP	: KEY_W,
	GO_DOWN : KEY_S,
	GO_LEFT : KEY_A,
	GO_RIGHT : KEY_D
});

// PADDLE 2

var KEY_I = 'I'.charCodeAt(0);
var KEY_K = 'K'.charCodeAt(0);
var KEY_J = 'J'.charCodeAt(0);
var KEY_L = 'L'.charCodeAt(0);

var g_paddle2 = new Paddle({
	cx : 370,
	cy : 300,
	
	GO_UP	: KEY_I,
	GO_DOWN : KEY_K,
	GO_LEFT : KEY_J,
	GO_RIGHT : KEY_L
});

// ==========
// BALL STUFF
// ==========

// BALL STUFF
function Ball(descr) {
	 for (var property in descr) {
		  this[property] = descr[property];
	 }
}

Ball.prototype.update = function () {
	 // Remember my previous position
	 var prevX = this.cx;
	 var prevY = this.cy;
	 
	 // Compute my provisional new position (barring collisions)
	 var nextX = prevX + this.xVel;
	 var nextY = prevY + this.yVel;

	 // Bounce off the paddles
	 if (g_paddle1.collidesWith(prevX, prevY, nextX, nextY, this.radius) ||
		  g_paddle2.collidesWith(prevX, prevY, nextX, nextY, this.radius))
	 {
		  this.xVel *= -1;
	 }

	 // Bounce off top and bottom edges
	 if (nextY < 0 ||										 // top edge
		  nextY > g_canvas.height) {					 // bottom edge
		  this.yVel *= -1;
	 }

	// bounce off left and right edges, also scoring
	if (nextX < 0) {
		this.xVel *= -1;
		score.p2++;
	}
	
	if (nextX > g_canvas.width) {
		this.xVel *= -1;
		score.p1++;
	}

	 // Reset if we fall off the left or right edges
	 // ...by more than some arbitrary `margin`
	 //
	 var margin = 4 * this.radius;
	 if (nextX < -margin || 
		  nextX > g_canvas.width + margin) {
		  this.reset();
	 }

	 // *Actually* update my position 
	 // ...using whatever velocity I've ended up with
	 //
	 this.cx += this.xVel;
	 this.cy += this.yVel;
};

Ball.prototype.reset = function () {
	 this.cx = 300;
	 this.cy = 100;
	 this.xVel = -5;
	 this.yVel = 4;
};

Ball.prototype.render = function (ctx) {
	 fillCircle(ctx, this.cx, this.cy, this.radius);
};

var g_ball = new Ball({
	 cx: 50,
	 cy: 200,
	 radius: 10,

	 xVel: 5,
	 yVel: 4
});

var g_ball2 = new Ball({
	 cx: 50,
	 cy: 200,
	 radius: 10,

	 xVel: 2.5,
	 yVel: 2
});

// =====
// UTILS
// =====

function clearCanvas(ctx) {
	 ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function fillCircle(ctx, x, y, r) {
	 ctx.beginPath();
	 ctx.arc(x, y, r, 0, Math.PI * 2);
	 ctx.fill();
}

// =============
// GATHER INPUTS
// =============

function gatherInputs() {
	 // Nothing to do here!
	 // The event handlers do everything we need for now.
}

// =================
// UPDATE SIMULATION
// =================

function updateSimulation() {
	 if (shouldSkipUpdate()) return;

	 g_ball.update();
	 g_ball2.update();
	 g_paddle1.update();
	 g_paddle2.update();
}

function renderScore(ctx, score) {
	ctx.font = 'bold 40px arial';

	ctx.fillText(score.p1, SCORE_OFFSET, FIELD_UPPER_BOUND);
	ctx.fillText(score.p2, g_canvas.width - SCORE_OFFSET, FIELD_UPPER_BOUND);
}

// Togglable Pause Mode
//
var KEY_PAUSE = 'P'.charCodeAt(0);
var KEY_STEP  = 'O'.charCodeAt(0);

var g_isUpdatePaused = false;

function shouldSkipUpdate() {
	 if (eatKey(KEY_PAUSE)) {
		  g_isUpdatePaused = !g_isUpdatePaused;
	 }
	 return g_isUpdatePaused && !eatKey(KEY_STEP);	  
}

// =================
// RENDER SIMULATION
// =================

function renderSimulation(ctx) {
	clearCanvas(ctx);
	renderScore(ctx, score);
	
	g_ball.render(ctx);
	g_ball2.render(ctx);
	g_paddle1.render(ctx);
	g_paddle2.render(ctx);
}

// ========
// MAINLOOP
// ========

function mainIter() {
	 if (!requestedQuit()) {
		  gatherInputs();
		  updateSimulation();
		  renderSimulation(g_ctx);
	 } else {
		  window.clearInterval(intervalID);
	 }
}

// Simple voluntary quit mechanism
//
var KEY_QUIT = 'Q'.charCodeAt(0);
function requestedQuit() {
	 return g_keys[KEY_QUIT];
}

window.onload = function() {
	g_canvas = document.getElementById("myCanvas");
	g_ctx = g_canvas.getContext("2d");
	
	// ..and this is how we set it all up, by requesting a recurring periodic
	// "timer event" which we can use as a kind of "heartbeat" for our game.
	//
	var intervalID = window.setInterval(mainIter, 16.666);

	//window.focus();
};
