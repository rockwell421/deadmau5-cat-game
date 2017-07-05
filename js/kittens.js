// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;


var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;


var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;


// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;


// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';


//new variable counter
var gameCounter = 0;


// Preload game images
var images = {};
['enemy.png', 'ded_sml.gif', 'splode_ded.gif'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});


// Preload background
var background = [];
['shimmeringstars.gif', 'sky.gif', 'stars.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    background.push(img);
})


//randomly selects a new background when the gameLoop is activated
var backgroundIndex = Math.floor(Math.random() * background.length);


//sets up the animated player deadmau5 image
var playerImage = [];
['ded_sml.gif', 'deadmau5_0000_Layer-6.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    playerImage.push(img);
});


//sets the player index image at 0
var playerIndexImage = 0;


class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}


class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

    //render(ctx) {
    //ctx.drawImage(this.sprite, this.x, this.y);
    //}
}

class Player extends Entity {
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = playerImage[playerIndexImage];

        // Step.1 declare var for player lives //in the player class
        this.playerLives = 3;
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }

    // Create lives functions //in the player class  
    changeLives(change) {
        this.playerLives += change;
    }

    //This loop goes through the animated Deadmau5 image array and restarts the rendering at the end of the array 

    render(ctx) {
        //console.log(gameCounter);
        if (gameCounter % 15 === 0) {
            if (playerIndexImage == playerImage.length - 1) {
                playerIndexImage = 0;
            }
            else {
                playerIndexImage += 1;
            }
            this.sprite = playerImage[playerIndexImage];
        }
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}



/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        //Changed the while loop from || to &&


        //console.log('? ' + enemySpots);
        //console.log(!enemySpot);


        while (this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        // console.log(enemySpot);

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);


    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();



        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {

        //frame counter; increases the game counter
        gameCounter += 1;

        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!

        this.ctx.drawImage(background[backgroundIndex], 0, 0); // draw the backgrounds
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            //Display lives // add it right in gameloop() right below the score both in if and else
            this.ctx.fillText('Lives: ' + this.player.playerLives, 5, 70)

            //Triggers the "Game Over" to appear on screen when the player runs out of lives
            this.ctx.fillText('GAME OVER!', GAME_WIDTH * .33, GAME_HEIGHT / 2);

            this.player.sprite = images['splode_ded.gif'];
            this.playerExplosion()
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            //Display lives // add it right in gameloop() right below the score both in if and else
            this.ctx.fillText('Lives: ' + this.player.playerLives, 5, 70)

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    playerExplosion() {
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // NEED TO CHANGE THIS
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player


        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });
        this.setupEnemies();

        this.lastFrame = Date.now();
        requestAnimationFrame(() => this.playerExplosion());
    }

    isPlayerDead() {
        //check for enemy and player collision by looping through the array of enemies and checking the value of their x & y coordinates
        var flag = false
        this.enemies.forEach((enemy, enemyIdx) => {
            if (
                enemy.y > this.player.y - ENEMY_HEIGHT * 0.7 &&
                enemy.y < this.player.y + 5 &&
                enemy.x === this.player.x
            ) {

        //Everytime a player dies, his live counts decrement by 1 // in function isPlayerDead()
                this.player.changeLives(-1);
                delete this.enemies[enemyIdx];
            }
        });

        // Until lives become 0, the game ends. //add it 
        if (this.player.playerLives === 0) {
            flag = true;
        }
        return flag;
    }
}


// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();