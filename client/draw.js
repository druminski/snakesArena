Meteor.startup(function () {
    canvas = document.getElementById("snakesArena");
    context = canvas.getContext("2d");
});

drawElementsOfTheGame = function(roomId) {
    var room = model.findOne({roomId : roomId});
    drawSnakes(room.snakes);
    drawFruit(room.fruit.posX, room.fruit.posY);
}

cleanArena = function() {    
    context.clearRect(0,0,canvas.width, canvas.height);
}

var drawFruit = function(posX, posY) {
    drawCircle(context, posX*BLOCK_SIZE + radiusForElelementAtArena, posY*BLOCK_SIZE + radiusForElelementAtArena,radiusForElelementAtArena, '255,0,0');
}

var drawSnakes = function(snakes){
    cleanArena();

    for (var snakeIndex=0; snakeIndex<snakes.length; snakeIndex++){
        if (snakes[snakeIndex].body.length > 0) {
            Meteor._debug("Pos: " + snakes[snakeIndex].body[snakes[snakeIndex].body.length-1].posX + "x" + snakes[snakeIndex].body[snakes[snakeIndex].body.length-1].posY + " size: " + snakes[snakeIndex].body.length + " direction: " + snakes[snakeIndex].direction +" lives: "+snakes[snakeIndex].lives+" color: " + snakes[snakeIndex].color);
            drawSnake(context, snakes[snakeIndex].body, snakes[snakeIndex].color);
        }
    }
}

var drawSnake = function(context, snakeBody, color){
    for (var bodyIndex=snakeBody.length-1; bodyIndex>=1; bodyIndex--){
        if (snakeBody[bodyIndex].posX == snakeBody[bodyIndex-1].posX){
            drawVerticalSegmentOfSnake(context, snakeBody, bodyIndex, color);
        }
        else if (snakeBody[bodyIndex].posY == snakeBody[bodyIndex-1].posY) {
            drawHorizontalSegmentOfSnake(context, snakeBody, bodyIndex, color);
        }
    }
}

var drawHorizontalSegmentOfSnake = function(context, snakeBody, bodyIndex, color){
    var beginPosX = Math.min(snakeBody[bodyIndex].posX, snakeBody[bodyIndex-1].posX);
    var endPosX = Math.max(snakeBody[bodyIndex].posX, snakeBody[bodyIndex-1].posX);

    if (endPosX - beginPosX < MAX_ARENA_COLUMNS) {
        for (beginPosX; beginPosX <= endPosX; beginPosX++){
            drawCircle(context, beginPosX * BLOCK_SIZE + radiusForElelementAtArena, snakeBody[bodyIndex].posY * BLOCK_SIZE + radiusForElelementAtArena, radiusForElelementAtArena, color);
        }
    }
}

var drawVerticalSegmentOfSnake = function(context, snakeBody, bodyIndex, color){
    var beginPosY = Math.min(snakeBody[bodyIndex].posY, snakeBody[bodyIndex-1].posY);
    var endPosY = Math.max(snakeBody[bodyIndex].posY, snakeBody[bodyIndex-1].posY);
    Meteor._debug("drawing from " + beginPosY + " to " + endPosY);
    if (endPosY - beginPosY < MAX_ARENA_ROWS) {
        for (beginPosY; beginPosY <= endPosY; beginPosY++){
            drawCircle(context, snakeBody[bodyIndex].posX * BLOCK_SIZE + radiusForElelementAtArena, beginPosY * BLOCK_SIZE + radiusForElelementAtArena, radiusForElelementAtArena, color);
        }
    }
}

var drawCircle = function(context, posX, posY, radius, color){
    context.beginPath();
    var rad = context.createRadialGradient(posX, posY, 1, posX, posY, radiusForElelementAtArena+4);
    rad.addColorStop(0, 'rgba('+color+',1)');
    rad.addColorStop(1, 'rgba('+color+',0)');
    context.fillStyle = rad;
    context.arc(posX, posY, radiusForElelementAtArena, 0, Math.PI*2, false);
    context.fill();
}
