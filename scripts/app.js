//@ts-check
/** @type {HTMLCanvasElement} */ //@ts-ignore canvas is an HTMLCanvasElement
const canvas = document.getElementById("game-canvas");
/** @type {CanvasRenderingContext2D} */ //@ts-ignore canvas is an HTMLCanvasElement
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const MOVE_UP = "up";
const MOVE_DOWN = "down";
const MOVE_LEFT = "left";
const MOVE_RIGHT = "right";

//Todo for game
// 	we need a start screen

let game = {
	gridSize: 20,
	refreshRate: 100, //milliseconds
};

class Player {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {game} game
	 */
	constructor(x, y, ctx, game) {
		this.x = x;
		this.y = y;
		this.game = game;
		this.ctx = ctx;

		this.currentDirection = MOVE_DOWN;
		this.requestedDirection = MOVE_DOWN;
		this.head = new Segment(this.x, this.y, "yellow", this.ctx); // use this color for partially invis snake #081418
		/** @type {Array<Segment>} */
		this.segments = [];
		this.sneakCount = 0;
		this.isDead = false;

		this.lastUpdate = 0;
		this.wireUpEvents();
	}

	isReverseMove() {
		if (
			this.requestedDirection == MOVE_RIGHT &&
			this.currentDirection == MOVE_LEFT
		)
			return true;
		if (
			this.requestedDirection == MOVE_LEFT &&
			this.currentDirection == MOVE_RIGHT
		)
			return true;
		if (
			this.requestedDirection == MOVE_DOWN &&
			this.currentDirection == MOVE_UP
		)
			return true;
		if (
			this.requestedDirection == MOVE_UP &&
			this.currentDirection == MOVE_DOWN
		)
			return true;

		return false;
	}

	/**
	 * @param {number} elapsedTime
	 */
	update(elapsedTime) {
		this.lastUpdate += elapsedTime;
		if (this.lastUpdate < this.game.refreshRate) return;
		this.lastUpdate = 0;

		if (this.isReverseMove()) {
			// check if reverse is available
			if (this.sneakCount == 0) {
				// valid reversal
				this.currentDirection = this.requestedDirection;
				this.sneakCount++;
				// figure out reversal

				let headX = this.head.x;
				let headY = this.head.y;

				/** @type {Segment} */ //@ts-ignore
				let tail = this.segments.pop();

				this.segments = this.segments.reverse();

				this.head.x = tail?.x;
				this.head.y = tail?.y;

				this.x = headX;
				this.y = headY;

				this.segments.push(tail);
			}
		} else {
			this.currentDirection = this.requestedDirection;
		}

		for (let i = this.segments.length - 1; i >= 1; i--) {
			this.segments[i].x = this.segments[i - 1].x;
			this.segments[i].y = this.segments[i - 1].y;
		}

		if (this.segments.length > 0) {
			this.segments[0].x = this.head.x;
			this.segments[0].y = this.head.y;
		}

		switch (this.currentDirection) {
			case MOVE_DOWN:
				this.head.y += this.game.gridSize;
				break;
			case MOVE_UP:
				this.head.y -= this.game.gridSize;
				break;
			case MOVE_RIGHT:
				this.head.x += this.game.gridSize;
				break;
			case MOVE_LEFT:
				this.head.x -= this.game.gridSize;
				break;
		}

		// check for death
		if (
			this.head.x < 0 ||
			this.head.y < 0 ||
			this.head.x >= canvas.width ||
			this.head.y >= canvas.height ||
			this.segments.some((s) => s.x == this.head.x && s.y == this.head.y)
		) {
			this.isDead = true;
		}
	}

	/**
	 * @param {Food} food
	 */
	grow(food) {
		for (let i = 0; i < food.growBy; i++) {
			this.segments.push(
				new Segment(this.head.x, this.head.y, "gold", this.ctx)
			);
		}
		this.sneakCount++;
	}

	draw() {
		// if(this.isDead) return;

		this.head.draw();
		this.segments.forEach((s) => {
			s.draw();
		});
	}

	wireUpEvents() {
		document.addEventListener("keydown", (e) => {
			// console.log(e);
			switch (e.code) {
				case "ArrowUp":
					this.requestedDirection = MOVE_UP;
					break;
				case "ArrowDown":
					this.requestedDirection = MOVE_DOWN;
					break;
				case "ArrowLeft":
					this.requestedDirection = MOVE_LEFT;
					break;
				case "ArrowRight":
					this.requestedDirection = MOVE_RIGHT;
					break;
			}
		});
	}
}

class Segment {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {string} color
	 * @param {CanvasRenderingContext2D} ctx
	 */
	constructor(x, y, color, ctx) {
		this.x = x;
		this.y = y;
		this.w = game.gridSize;
		this.h = game.gridSize;
		this.color = color;
		this.ctx = ctx;
	}

	update() {}

	draw() {
		this.ctx.fillStyle = this.color;
		this.ctx.fillRect(this.x, this.y, this.w, this.h);
	}
}

// food notes
// when you run into your snake grows - randomize cheese
//	red food + 1 segments
//	blue food + 2 segments
//	gold food + 5 segments
//	black food + 20 segments
// start with circles
// spawn random grid
//	within the boundries of the grid
//	only spawn on empty grid spots
// How many food spawn?
//	Make it configurate
//	At least 4

class Food {
	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	constructor(ctx) {
		this.ctx = ctx;
		this.x = 0;
		this.y = 0;
		this.radius = game.gridSize / 2;
		this.color = "red";
		this.growBy = 1;
		this.sneakAttempts = 0;
		this.isEaten = true;
	}

	/**
	 * @param {Array<Player>} [players]
	 * @param {Array<Food>} [food]
	 */
	spawn(players, food) {
		// reset eaten state
		this.isEaten = false;

		let foodType = Math.floor(Math.random() * 8 + 1);

		switch (foodType) {
			case 1:
			case 2:
				this.color = "red";
				this.growBy = 3;
				this.sneakAttempts = 2;
				break;
			case 3:
			case 4:
			case 5:
				this.color = "blue";
				this.growBy = 2;
				this.sneakAttempts = 1;
				break;
			case 6:
			case 7:
				this.color = "green";
				this.growBy = 5;
				break;
			// case 5:
			// 	this.color = "black";
			// 	this.growBy = 100;
			// 	break;
			default:
				this.color = "white";
				this.growBy = 250;
				break;
		}

		let xGridMaxValue = canvas.width / game.gridSize;
		let yGridMaxValue = canvas.height / game.gridSize;

		let randomX = Math.floor(Math.random() * xGridMaxValue);
		let randomY = Math.floor(Math.random() * yGridMaxValue);

		const MAX_TRIES = 10;
		let tryCount = 1;
		do{
			let isOverLapping = false;

			players?.forEach((p) => {
				if(p.head.x == randomX && p.head.y == randomY) {
					isOverLapping = true;
				}
				if(p.segments.some((s) => s.x == randomX && s.y == randomY)) {
					isOverLapping = true;
				};
			});

			if(isOverLapping == false) {
				isOverLapping = food?.some((f) => f.x == randomX && f.y == randomY) ?? 
			}

			if(isOverLapping == false) {
				tryCount = MAX_TRIES
			}
		} while(tryCount < MAX_TRIES)

		this.x = randomX * game.gridSize;
		this.y = randomY * game.gridSize;
	}

	update() {}

	draw() {
		if (this.isEaten) return;

		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.arc(
			this.x + this.radius,
			this.y + this.radius,
			this.radius,
			0,
			Math.PI * 2
		);
		this.ctx.fill();
		this.ctx.closePath();
	}
}

// Other things we can run into - Ideas
// Bomb
// Makes you faster

let p1 = new Player(5 * game.gridSize, 5 * game.gridSize, ctx, game);

let food = [new Food(ctx), new Food(ctx), new Food(ctx), new Food(ctx)];

/**
 * @param {Array<Player>} players
 * @param {Array<Food>} food
 */
function checkIfFoodIsConsumed(players, food) {
	food.forEach((f) => {
		players.forEach((p) => {
			//
			if (p.head.x == f.x && p.head.y == f.y) {
				console.log("food is eaten");
				// food is eaten
				f.isEaten = true;
				p.grow(f);
			}
		});
	});
}

// let f1 = new Food(ctx);
// f1.spawn();

let currentTime = 0;

function gameLoop(timestamp) {
	let elapsedTime = timestamp - currentTime;
	currentTime = timestamp;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	p1.update(elapsedTime);
	p1.draw();

	food.forEach((f) => {
		f.draw();
	});

	checkIfFoodIsConsumed([p1], food);

	food.filter((f) => f.isEaten).forEach((f) => {
		f.spawn([p1], food);
	});

	let isGameOver = [p1].some((p) => p.isDead);

	if (isGameOver) {
		return;
	}

	requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
