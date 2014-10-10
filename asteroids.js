// Screen Size
var WIDTH = 800;
var HEIGHT = 480;

// PI / 2 Constant
var HALF_PI = 1.5707963

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
var Ship = function() {

	this.angle = 0;
	this.bullets = [];

};

Ship.prototype = {

	render: function(context) {
		
		var c = context;

		this.bullets.forEach( function(bullet){
			c.beginPath();
			c.strokeStyle="#FFFFFF";
			c.moveTo(bullet.x,bullet.y);
			c.lineTo(bullet.x + bullet.length * Math.sin(bullet.angle), bullet.y + bullet.length * Math.cos(bullet.angle));
			c.stroke();
		});

		context.lineWidth = 2;
		context.save();
		context.translate(400, 220);
		context.rotate(this.angle);
		context.fillStyle="#FFFFFF";
		context.strokeStyle="#000000";
		context.beginPath();
		context.moveTo(0,-25);
		context.lineTo(10,10);
		context.lineTo(-10,10);
		context.closePath();
		context.fill();
		context.stroke();
		//context.translate(0, 50);
		context.restore();
	},

	update: function(elapsedTime) {
		this.bullets.forEach( function(bullet){
			bullet.x += elapsedTime * bullet.velocity * Math.sin(bullet.angle);
			bullet.y += elapsedTime * bullet.velocity * Math.cos(bullet.angle);
		});
	},

	fire: function(){

		//this.bullets.push({x1:400 * Math.sin(this.angle) x2:400 * Math.sin(this.angle) y1:205 * Math.cos(this.angle) y2: 205 * Math.cos(this.angle)})
		this.bullets.push({x:400 + 40 * Math.sin(this.angle), y:225 - 10 * Math.cos(-1 *this.angle),velocity:-.25, angle:-1 * this.angle, length:5});
	}

};

// ASTEROID
//---------------------------
var Asteroid = function(velocity, angle, mass) {
	if(velocity !== undefined) this.velocity = velocity;
	if(angle !== undefined) this.angle = angle;
	if(mass !== undefined) this.radius = mass;
	this.x = Math.random() * WIDTH;
	this.y = Math.random() * HEIGHT;
	this.crators = [];
	this.spin = Math.random() * .005;
	this.spin_angle = 0;

	number_of_crators = Math.random() * 3;

	for(var i = 0; i < number_of_crators; i++){

		var attempts = 0;

		while(!this.createCrator()){
			attempts++;

			if(attempts > 10)
				break;
		}

	} 

};

Asteroid.prototype = {
	x: 0,
	y: 0,
	radius: 10,
	velocity: 10,
	angle: 0,
	
	render: function(context) {
		var self = this;

		context.save();
		context.strokeStyle = "#000000";
		context.fillStyle = "#aaaaaa";
		context.beginPath();
		context.arc(this.x, this.y, this.radius, 0, 2*Math.PI, false);
		context.fill();
		context.stroke();
		context.restore();

		var c = context;

		this.crators.forEach( function(crator) {
			c.save();
			c.translate(self.x, self.y);
			c.rotate(self.spin_angle);
			c.strokeStyle = "#000000";
			c.fillStyle = "#aaaaaa";
			c.beginPath();
			c.arc(crator.x, crator.y, 2, 0, 2*Math.PI, false);
			c.fill();
			c.stroke();
			c.restore();
		});
		
	},
	
	update: function(elapsedTime) {
		this.x += elapsedTime * this.velocity * Math.sin(this.angle);
		this.y += elapsedTime * this.velocity * Math.cos(this.angle);
		this.spin_angle += elapsedTime * this.spin;
		
		// Wrap asteroid when going off-screen
		if(this.x < - this.radius) this.x += WIDTH + this.radius;
		if(this.x > WIDTH + this.radius) this.x -= WIDTH + this.radius;
		if(this.y < - this.radius) this.y += HEIGHT + this.radius;
		if(this.y > HEIGHT + this.radius) this.y -= HEIGHT + this.radius;
		
		// TODO: Rotate the asteroid
	},

	createCrator: function(){
		var self = this;

		var crator_x = Math.random() * 6;
		var crator_y = Math.random() * (6 - crator_x);
        var neg_or_positive = Math.round(Math.random()) * 2 - 1;
        crator_x *= neg_or_positive;
        neg_or_positive = Math.round(Math.random()) * 2 - 1;
        crator_y *= neg_or_positive;


		canCreate = true;

		self.crators.forEach( function(crator) {

			if(Math.pow(crator.x - crator_x, 2) + Math.pow(crator.y - crator_y, 2) <= 25){
				canCreate = false;
			}

		});

		if(canCreate)
			this.crators.push({x:crator_x, y:crator_y})

		return canCreate;
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

  this.ship;
  this.fireMissile;
  this.missileInterval = 0;

  this.asteroidsDestroyed = 0;

  this.lives = 3;
  
  window.addEventListener("blur", function( event) {
    myself.paused = true;
  });
}
	
Asteroids.prototype = {

	makeTree: function(points, center_x, center_y, width, height){

		if(points.length === 0 || width <= 10 || height <= 10)
			return;

		// This is the node that will be returned.
		var n = {children:[], points:[], center_x:center_x, center_y:center_y};

		if(points.length < 5) {
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

	checkCollision: function(asteroid, points, type){
		var self = this;

		points.forEach( function(point) {
			
			// If this the point is the Asteroid, don't check collision.
			if(asteroid.x != point.x && asteroid.y != point.y){
				
			  	if(Math.pow(asteroid.x - point.x, 2) + Math.pow(asteroid.y - point.y, 2) <= 450){

			  		if(type === 0){
			        	var contact_angle = Math.atan(Math.abs(point.y - asteroid.y) / Math.abs(point.x - asteroid.x));
			    
			        	var v_1_x = point.velocity * Math.cos(point.angle - contact_angle) * Math.cos(contact_angle) + asteroid.velocity * Math.sin(asteroid.angle - contact_angle) * Math.cos(contact_angle + HALF_PI);
			          
			        	var v_1_y = point.velocity * Math.cos(point.angle - contact_angle) * Math.sin(contact_angle) + asteroid.velocity * Math.sin(asteroid.angle - contact_angle) * Math.sin(contact_angle + HALF_PI);
			  
			        	var v_2_x = asteroid.velocity * Math.cos(asteroid.angle - contact_angle) * Math.cos(contact_angle) + point.velocity * Math.sin(point.angle - contact_angle) * Math.cos(contact_angle + HALF_PI);
			          
			        	var v_2_y = asteroid.velocity * Math.cos(asteroid.angle - contact_angle) * Math.sin(contact_angle) + point.velocity * Math.sin(point.angle - contact_angle) * Math.sin(contact_angle + HALF_PI);
			  
			        	asteroid.new_velocity = Math.sqrt(v_1_x * v_1_x + v_1_y * v_1_y);
			        	point.new_velocity = Math.sqrt(v_2_x * v_2_x + v_2_y * v_2_y);
			        	asteroid.new_angle = Math.atan(v_1_y / v_1_x);
			        	asteroid.new_angle = Math.atan(v_2_y / v_2_x);
		        	}
		        	else{

		        		point.x = -500;
		        		point.y = -500;
		        		point.velocity = 0;
		        		point.angle = 0;
		        		asteroid.x = -500;
		        		asteroid.y = -500;
		        		self.asteroidsDestroyed++;
					}

		          Resource.sfx.collide.play();
				}
			}
		});

		if(asteroid.x > -500 && type === 0){
			if(Math.pow(asteroid.x - 400, 2) + Math.pow(asteroid.y - 220,2) <= 500){
				asteroid.x = -500;
			    asteroid.y = -500;
			    asteroid.velocity = 0;
			    asteroid.angle = 0;
			    self.asteroidsDestroyed++;
			    self.lives--;

			    Resource.sfx.collide.play();
			}
		}

		

	},

	recurseTree: function(point, node, type) {

		if(typeof node === 'undefined')
			return;
		if(node.children.length === 0){
			this.checkCollision(point, node.points, type);
		}
		else{

			if(point.x + 10 >= node.center_x && point.y - 10 <= node.center_y){
				this.recurseTree(point, node.children[0], type);
			}
			if(point.x - 10 <= node.center_x && point.y - 10 <= node.center_y){
				this.recurseTree(point, node.children[1], type);
			}
			if(point.x - 10 <= node.center_x && point.y + 10 >= node.center_y){
				this.recurseTree(point, node.children[2], type);
			}
			if(point.x + 10 >= node.center_x && point.y + 10 >= node.center_y){
				this.recurseTree(point, node.children[3], type);
			}
		}

	},

	update: function(elapsedTime) {
		var self = this;

		this.ship.update(elapsedTime);

		if(this.fireMissile){

			self.missileInterval -= elapsedTime;

			if(self.missileInterval <= 0){
				self.missileInterval = 20;
				self.ship.fire();
				self.fireMissile = false;
			}
			else{
				self.fireMissile = false;
			}
		}

		// Update asteroids
		this.asteroids.forEach( function(asteroid) {
			asteroid.update(elapsedTime);
		});
		
		// TODO: handle asteroid collisions
		quadtree = this.makeTree(this.asteroids, WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);
    
    	this.asteroids.forEach( function(asteroid) {
			asteroid.new_velocity = asteroid.velocity;
			asteroid.new_angle = asteroid.angle;
		});
    
		this.asteroids.forEach( function(asteroid) {
			self.recurseTree(asteroid, quadtree, 0);
		});
		
		this.asteroids.forEach( function(asteroid) {
			asteroid.velocity = asteroid.new_velocity;
			asteroid.angle = asteroid.new_angle;
		});
		
		for(var i = 0; i < this.ship.bullets.length; i++){

			self.recurseTree(self.ship.bullets[i], quadtree, 1);
			
			if(self.ship.bullets[i].x < 0 || this.ship.bullets[i].y < 0 || self.ship.bullets[i].x > 800 || this.ship.bullets[i].y > 480)
				self.ship.bullets.splice(i, 1);
		}

		for(var i = 0; i < this.level * 10 - self.asteroidsDestroyed; i++){
			if(self.asteroids[i].x == -500)
				self.asteroids.splice(i, 1);
		}

		if(this.lives <= 0){
			this.gameOver = true;
		}
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

		this.ship.render(self.backBufferContext);
		
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
		this.renderGuiText("Lives: " + this.lives, 20, 20);
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

		this.ship = new Ship();
		
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
			case 37: // Left
				this.ship.angle -= 0.25;
				break;
			case 39: // Right
				this.ship.angle += 0.25;
				break;
			case 38: // Up
				this.fireMissile = true;
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
		
		if(!this.gameOver) self.update(elapsedTime);
		self.render(elapsedTime);
		if(this.asteroidsDestroyed == this.level * 10){
			this.asteroidsDestroyed = 0;
			this.level++;
			this.beginLevel();
		}
			
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