DISTANCE_BETWEEN_SNAKES_AT_START = 5;

moveSnakesPositions = function(snakes) {
    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (isSnakePlaying(snakes[snakeIndex])) {
            snakes[snakeIndex] = getSnakeWithNewPosition(snakes[snakeIndex]);
        }
    }
}

handleCollisions = function(room, snakes) {
    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (isSnakePlaying(snakes[snakeIndex])) {
            snakes[snakeIndex].isSnakeInCollision = isSnakeInCollision(snakeIndex, snakes);
        }
    }

    var info = "";
    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (snakes[snakeIndex].isSnakeInCollision) {
            Meteor._debug("collision");
            snakes[snakeIndex] = getSnakeWithHandledCollision(snakes[snakeIndex], snakeIndex);
            info += snakes[snakeIndex].name + " lost life ";
            room.info = info;
        }
    }
}

handleTeleport = function(snakes) {
    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (isSnakePlaying(snakes[snakeIndex]) && isSnakeHittingIntoWall(getHead(snakes[snakeIndex].body))) {
            Meteor._debug("wall");
            snakes[snakeIndex].body = getTeleportedBodyOfSnake(snakes[snakeIndex].body);
        }
    }
}

handleFruits = function(room, snakes) {
    var fruitWasEaten=false;

    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (isSnakePlaying(snakes[snakeIndex]) && isSnakeEatingFruit(snakes[snakeIndex], room.fruit)) {
            var howManyElementsAddToTail = 3;
            Meteor._debug("fruit");
            snakes[snakeIndex].points += howManySnakesArePlaying(snakes)*2;
            snakes[snakeIndex] = getSnakeWithMovedTailPosition(snakes[snakeIndex], howManyElementsAddToTail);
            fruitWasEaten = true;
            room.info =  snakes[snakeIndex].name + " ate a fruit.";
        }
    }

    if (fruitWasEaten) {
        room.fruit = getRandomPosition(MAX_ARENA_COLUMNS, MAX_ARENA_ROWS);
    }
}

isOppositeDirection = function(direction1, direction2) {
    if (
        (direction1 == DIRECTION.LEFT && direction2 == DIRECTION.RIGHT) ||
            (direction1 == DIRECTION.UP && direction2 == DIRECTION.DOWN) ||
            (direction1 == DIRECTION.RIGHT && direction2 == DIRECTION.LEFT) ||
            (direction1 == DIRECTION.DOWN && direction2 == DIRECTION.UP)) {
        return true;
    }
    else {
        return false;
    }
}

getSnakesWithChangedStatus = function (snakes, status) {
    for(var index=0; index < snakes.length; index++) {
        snakes[index].status = status;
    }
    return snakes
}

var isSnakeEatingFruit = function(snake, fruit) {
    if (getHead(snake.body).posX == fruit.posX && getHead(snake.body).posY == fruit.posY ) {
        return true;
    }
    else {
        return false;
    }
}

var getSnakeWithHandledCollision = function(snake, snakeIndex) {
    snake.lives -= 1;
    snake.isSnakeInCollision = false;
    snake.direction = DIRECTION.UP;
    snake.newDirection = DIRECTION.UP;
    snake.body.length = 0;
    snake.body.push(
        {posX : snakeIndex*DISTANCE_BETWEEN_SNAKES_AT_START + DISTANCE_BETWEEN_SNAKES_AT_START, posY : 28},
        {posX : snakeIndex*DISTANCE_BETWEEN_SNAKES_AT_START + DISTANCE_BETWEEN_SNAKES_AT_START, posY : 20});

    if (snake.lives <= 0) {
        snake.status = GAME_STATUS.END;
    }

    return snake;
}

var getTeleportedBodyOfSnake = function (body) {
    var head = getHead(body);

    if (head.posX <= -1) {
        body.push({posX : MAX_ARENA_COLUMNS, posY : head.posY});
        body.push({posX : MAX_ARENA_COLUMNS-1, posY : head.posY});
    }
    else if (head.posX >= MAX_ARENA_COLUMNS){
        body.push({posX : -1, posY : head.posY});
        body.push({posX : 0, posY : head.posY});
    }
    else if (head.posY >= MAX_ARENA_ROWS) {
        body.push({posX : head.posX, posY : -1});
        body.push({posX : head.posX, posY : 0});
    }
    else if (head.posY <= -1) {
        body.push({posX : head.posX, posY : MAX_ARENA_ROWS});
        body.push({posX : head.posX, posY : MAX_ARENA_ROWS-1});
    }
    return body;
}

var isSnakeHittingIntoWall = function(snakeHead) {
    if (snakeHead.posX <= -1 || snakeHead.posX >= MAX_ARENA_COLUMNS || snakeHead.posY <= -1 || snakeHead.posY >= MAX_ARENA_ROWS) {
        return true;
    }
    else {
        return false;
    }
}

var isSnakeInCollision = function(verifiedSnakeIndex, snakes) {
    var head = getHead(snakes[verifiedSnakeIndex].body);
    for (var snakeIndex=0; snakeIndex < snakes.length; snakeIndex++) {
        if (isSnakePlaying(snakes[snakeIndex])){
            var body = snakes[snakeIndex].body;
            var endIndex = body.length;
            if (verifiedSnakeIndex == snakeIndex) {
                endIndex--;
            }
            for (var bodyIndex=1; bodyIndex < endIndex; bodyIndex++) {
                if (!isPointOutOfArea(body[bodyIndex]) && isPointOnSegment(body[bodyIndex-1], body[bodyIndex], head)) {
                    return true;
                }
            }
        }
    }
    return false;
}

var getLastSnakeDirection = function(snake) {
    if (getHead(snake.body).posX == getNeck(snake.body).posX){

        if (getHead(snake.body).posY < getNeck(snake.body).posY) {
            return DIRECTION.UP;
        }
        else {
            return DIRECTION.DOWN;
        }
    }
    else {
        if (getHead(snake.body).posX < getNeck(snake.body).posX) {
            return DIRECTION.LEFT;
        }
        else {
            return DIRECTION.RIGHT;
        }
    }
}

var getSnakeWithMovedHeadPosition = function(snake) {
    if (snake.direction == DIRECTION.LEFT) {
        getHead(snake.body).posX -= 1;
    }
    else if (snake.direction == DIRECTION.RIGHT) {
        getHead(snake.body).posX += 1;
    }
    else if (snake.direction == DIRECTION.UP) {
        getHead(snake.body).posY -= 1;
    }
    else if (snake.direction == DIRECTION.DOWN) {
        getHead(snake.body).posY += 1;
    }

    return snake;
}

var getSnakeWithNewHead = function(snake) {
    if (snake.direction == DIRECTION.UP) {
        snake.body.push({posX : getHead(snake.body).posX, posY : getHead(snake.body).posY - 1});
    }
    else if (snake.direction == DIRECTION.DOWN) {
        snake.body.push({posX : getHead(snake.body).posX, posY : getHead(snake.body).posY + 1});
    }
    else if (snake.direction == DIRECTION.LEFT) {
        snake.body.push({posX : getHead(snake.body).posX - 1, posY : getHead(snake.body).posY});
    }
    else if (snake.direction == DIRECTION.RIGHT) {
        snake.body.push({posX : getHead(snake.body).posX + 1, posY : getHead(snake.body).posY});
    }

    return snake;
}

var getSnakeWithNewPosition = function(snake) {
    snake.direction = snake.newDirection;

    //head
    if (snake.direction == getLastSnakeDirection(snake)) {
        snake = getSnakeWithMovedHeadPosition(snake);
    }
    else {
        snake = getSnakeWithNewHead(snake);
    }

    //tail
    snake = getSnakeWithNewTailPosition(snake);

    return snake;
}

var isSnakePlaying = function(snake) {
    if (snake.status == GAME_STATUS.PLAYING) {
        return true;
    }
    else {
        return false;
    }
}

var getSnakeWithNewTailPosition = function(snake) {
    if (Math.abs(getTail(snake.body).posX - getTail2(snake.body).posX) == 1 ||
        Math.abs(getTail(snake.body).posY - getTail2(snake.body).posY) == 1) {

        snake.body.shift();
        if (getTail(snake.body).posX == -1 || getTail(snake.body).posX == MAX_ARENA_COLUMNS ||
            getTail(snake.body).posY == -1 || getTail(snake.body).posY == MAX_ARENA_ROWS) {
            snake.body.shift();
            snake = getSnakeWithNewTailPosition(snake);
        }
    }
    else {
        snake = getSnakeWithMovedTailPosition(snake, -1);
    }

    return snake;
}

var getSnakeWithMovedTailPosition = function(snake, move) {
    if (getTail(snake.body).posX == getTail2(snake.body).posX) {
        if (getTail(snake.body).posY > getTail2(snake.body).posY) {
            getTail(snake.body).posY += move;
        }
        else {
            getTail(snake.body).posY -= move;
        }
    }
    else {
        if (getTail(snake.body).posX > getTail2(snake.body).posX) {
            getTail(snake.body).posX += move;
        }
        else {
            getTail(snake.body).posX -= move;
        }
    }

    return snake;
}

var isPointOutOfArea = function(point) {
    if (point.posX == -1 || point.posX == MAX_ARENA_COLUMNS || point.posY == -1 || point.posY == MAX_ARENA_ROWS) {
        return true;
    }
    else {
        return false;
    }
}

//function can be simpler, beacuse we have only vertical and horizontal segments
var isPointOnSegment = function(pointA, pointB, pointP) {
    var det = pointA.posX*pointB.posY + pointB.posX*pointP.posY + pointP.posX*pointA.posY
        - pointP.posX*pointB.posY - pointA.posX*pointP.posY - pointB.posX*pointA.posY;
    if (det == 0) {
        if ( (Math.min(pointA.posX, pointB.posX) <= pointP.posX) && (pointP.posX <= (Math.max(pointA.posX, pointB.posX))) &&
            (Math.min(pointA.posY, pointB.posY) <= pointP.posY) && (pointP.posY <= (Math.max(pointA.posY, pointB.posY)))) {
            return true;
        }
    }
    return false;
}

var howManySnakesArePlaying = function(snakes) {
    var howManyPlayersArePlaying = 0;
    for(var index=0; index < snakes.length; index++) {
        if (snakes[index].status == GAME_STATUS.PLAYING) {
            howManyPlayersArePlaying++;
        }
    }
    return howManyPlayersArePlaying;
}