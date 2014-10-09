// Screen Size
var WIDTH = 800;
var HEIGHT = 480;

var MathHelper = {
	clamp: function(value, min, max){
		if(value <= min) return min;
		if(value >= max) return max;
		return value;
	}
};

// RESOURCES
// ----------------------------------
var Resource = { img: {}, sfx: {}}

Resource.img.background = new Image();
Resource.img.background.src = "outer_space.jpg";
Resource.sfx.collide = new Audio();
Resource.sfx.collide.src = "collide.wav";

// Node
//---------------------------
var Node = function() {

	var children = [];
	var points = [];

};

Node.prototype = {

	children: [],
	points: [],

};

// ASTEROID
//---------------------------
var Asteroid = function(velocity, angle, mass) {
	if(velocity !== undefined) this.velocity = velocity;
	if(angle !== undefined) this.angle = angle;
	if(mass !== undefined) this.radius = mass;
	this.x = Math.random() * WIDTH;
	this.y = Math.random() * HEIGHT;
};

Asteroid.prototype = {
	x: 0,
	y: 0,
	radius: 10,
	velocity: 10,
	angle: 0,
	
	render: function(context) {
		context.save();
		context.strokeStyle = "#000000";
		context.fillStyle = "#aaaaaa";
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
		context.fill();
		context.stroke();
		context.restore();
	},
	
	update: function(elapsedTime) {
		this.x += elapsedTime * this.velocity * Math.sin(this.angle);
		this.y += elapsedTime * this.velocity * Math.cos(this.angle);
		
		// Wrap asteroid when going off-screen
		if(this.x < - this.radius) this.x += WIDTH + this.radius;
		if(this.x > WIDTH + this.radius) this.x -= WIDTH + this.radius;
		if(this.y < - this.radius) this.y += HEIGHT + this.radius;
		if(this.y > HEIGHT + this.radius) this.y -= HEIGHT + this.radius;
		
		// TODO: Rotate the asteroid
	}
};

var Asteroids = function (canvasId) {
  var myself = this;
  
  // Rendering variables
	this.frontBuffer = document.getElementById(canvasId);
	this.frontBufferContext = this.frontBuffer.getContext('2d');
  this.backBuffer = document.createElement('canvas');
	this.backBuffer.width = this.frontBuffer.width;
	this.backBuffer.height = this.frontBuffer.height;
  this.backBufferContext = this.backBuffer.getContext('2d');
  
  // Game variables
  this.asteroids = [];
  this.level = 1;
  this.gameOver = false;
	
  // Timing variables
  this.startTime = 0;
  this.lastTime = 0;
  this.gameTime = 0;
  this.fps = 0;
  this.STARTING_FPS = 60;

   // Pausing variables
  this.paused = false;
  this.startedPauseAt = 0;
  this.PAUSE_TIMEOUT = 100;

  // Spatial Data Structure for Collision.
  this.quadtree;
  
  window.addEventListener("blur", function( event) {
    myself.paused = true;
  });
}
	
Asteroids.prototype = {

	makeTree: function(points, center_x, center_y, width, height){

		if(points.length === 0 || width < 30 || height < 30)
			return;

		// This is the node that will be returned.
		var n = {children:[], points:[], center_x:center_x, center_y:center_y};

		if(points.length < 3) {
			n.points = points;
			return n;
		}

		// Calculate half the width and height.
		var half_width = 0.5 * width;
		var half_height = 0.5 * height;

		// Create a list for each quadrant.
		var list_quad_1 = [];
		var list_quad_2 = [];
		var list_quad_3 = [];
		var list_quad_4 = [];

		points.forEach(function(point) {

			if(point.x >= center_x && point.y <= center_y)
				list_quad_1.push(point);
			else if(point.x <= center_x && point.y <= center_y)
				list_quad_2.push(point);
			else if(point.x <= center_x && point.y >= center_y)
				list_quad_3.push(point);
			else
				list_quad_4.push(point);

		});

		n.children.push(this.makeTree(list_quad_1, center_x + half_width, center_y - half_height, half_width, half_height));
		n.children.push(this.makeTree(list_quad_2, center_x - half_width, center_y - half_height, half_width, half_height));
		n.children.push(this.makeTree(list_quad_3, center_x - half_width, center_y + half_height, half_width, half_height));
		n.children.push(this.makeTree(list_quad_4, center_x + half_width, center_y + half_height, half_width, half_height));

		return n;

	},

	checkCollision: function(asteroid, points){
		var self = this;

		points.forEach( function(point) {
			
			if(asteroid.x != point.x && asteroid.y != point.y){
				if(Math.pow(asteroid.x - point.x, 2) + Math.pow(asteroid.y - point.y, 2) <= 400){
					//asteroid.velocity = 0;
					//point.velocity = 0;

					//var x = asteroid.velocity + point.velocity;

					//point.velocity = (x + Math.sqrt(x * x - 2 * (x - x * x))) / 2
					point.velocity = -point.velocity;
					asteroid.velocity = -asteroid.velocity;
				}
			}

		});

	},

	recurseTree: function(point, node) {

		if(typeof node === 'undefined')
			return;
		if(node.children.length === 0){
			this.checkCollision(point, node.points);
		}
		else{

			if(point.x + 10 >= node.center_x && point.y - 10 <= node.center_y){
				this.recurseTree(point, node.children[0]);
			}
			if(point.x - 10 <= node.center_x && point.y - 10 <= node.center_y){
				this.recurseTree(point, node.children[1]);
			}
			if(point.x - 10 <= node.center_x && point.y + 10 >= node.center_y){
				this.recurseTree(point, node.children[2]);
			}
			if(point.x + 10 >= node.center_x && point.y + 10 >= node.center_y){
				this.recurseTree(point, node.children[3]);
			}
		}

	},

	update: function(elapsedTime) {
		var self = this;

		// Update asteroids
		this.asteroids.forEach( function(asteroid) {
			asteroid.update(elapsedTime);
		});
		
		// TODO: handle asteroid collisions
		quadtree = this.makeTree(this.asteroids, WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);

		this.asteroids.forEach( function(asteroid) {
			self.recurseTree(asteroid, quadtree);
		});
		
	},
	
	render: function(elapsedTime) {
		var self = this;
		
	    // Clear screen
		this.backBufferContext.fillStyle = "#000";
		this.backBufferContext.fillRect(0, 0, WIDTH, HEIGHT);
		this.backBufferContext.drawImage(Resource.img.background, 0, 0);
		
		// Render asteroids
		this.asteroids.forEach( function(asteroid) {
			asteroid.render(self.backBufferContext);
		});
		
		// Render GUI
		if(this.gameOver){
			this.renderGuiText("Game Over", 380, 220);
			this.renderGuiText("Press [enter] for new game", 300, 260);
		}
		else if(this.paused) {
			this.renderGuiText("Paused", 380, 220);
			this.renderGuiText("Press [space] to continue", 300, 260);
		}
		if(this.displayLevel) {
			this.renderGuiText("Level " + this.level, 380, 220);
		}
		this.frontBufferContext.drawImage(this.backBuffer, 0, 0);
	},
	
	renderGuiText: function(message, x, y){
		this.backBufferContext.save();
		this.backBufferContext.font = "20px Arial";
		this.backBufferContext.fillStyle = "#ffffff";
		this.backBufferContext.fillText(message, x, y);
		this.backBufferContext.fillText(message, x, y);
		this.backBufferContext.restore();
	},
	
	beginLevel: function(){
	  var self = this;
		
		// Create asteroids
		for(i = 0; i < this.level * 10; i++) { 
		  this.asteroids.push( new Asteroid(
		    Math.random() * 0.1 * this.level,
				Math.random() * 2 * Math.PI
			));
		}
		
		// Display level in GUI temporarily
		this.displayLevel = true;
		setTimeout(function(){self.displayLevel = false;}, 3000);
	},
	
	keyDown: function(e)
	{
		switch(e.keyCode){
		  case 13: // ENTER
			  if(game.gameOver) {
					this.level = 1;
					this.score = 0;
					this.beginLevel();
					this.gameOver = false;
				}
				break;
			case 32: // SPACE
				this.paused = !this.paused;
				break;
		}
	},
	
	start: function() {
		var self = this;
    
		window.onkeydown = function (e) { self.keyDown(e); };
		
		this.beginLevel();
		this.gameOver = false;
		this.startTime = Date();
		
		window.requestNextAnimationFrame(
			function(time) {
				self.loop.call(self, time);
			}
		);
	},
	
	loop: function(time) {
		var self = this;
		
		if(this.paused || this.gameOver) this.lastTime = time;
		var elapsedTime = time - this.lastTime; 
		this.lastTime = time;
		
		self.update(elapsedTime);
		self.render(elapsedTime);
			
		if (this.paused || this.gameOver) {
			 // In PAUSE_TIMEOUT (100) ms, call this method again to see if the game
			 // is still paused. There's no need to check more frequently.
			 
			 setTimeout( function () {
					window.requestNextAnimationFrame(
						 function (time) {
								self.loop.call(self, time);
						 });
			 }, this.PAUSE_TIMEOUT);
             
		}	else {
			
			window.requestNextAnimationFrame(
				function(time){
					self.loop.call(self, time);
				}
			);
		}
	}
}

var game = new Asteroids('myCanvas');
console.log(game);
game.start();