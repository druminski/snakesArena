GAME_STATUS = {
    END : "end",
    WAITING : "waiting",
    PLAYING: "playing"
};

DIRECTION = {
    UP : "up",
    RIGHT: "right",
    DOWN : "down",
    LEFT : "left"
};

MAX_ARENA_COLUMNS = 80;
MAX_ARENA_ROWS = 50;

NOT_UNIQE_NICK_NAME = "notUniqueNickname";

getHead = function (body){
    return body[body.length-1];
}

getNeck = function (body){
    return body[body.length-2];
}

getTail = function (body){
    return body[0];
}

getTail2 = function (body){
    return body[1];
}

getRandomPosition = function(maxX, maxY) {
    var x = getRandomValueFrom0ToMax(maxX);
    var y = getRandomValueFrom0ToMax(maxY);

    return {posX: x, posY: y};
}

getRandomColorAsString = function() {
    var minColor = 50;
    var maxColor = 180;
    var r = getRandomValueFromMinToMax(minColor, maxColor);
    var g = getRandomValueFromMinToMax(minColor, maxColor);
    var b = getRandomValueFromMinToMax(minColor, maxColor);

    return '' + r + ',' + g + ',' + b;
}

getRandomValueFrom0ToMax = function(max) {
    return getRandomValueFromMinToMax(0, max);
}

getRandomValueFromMinToMax = function(min, max) {
    var randomValue = (Math.floor(Random.fraction() * (1000)) + 1) % (max-min);
    return min + randomValue;
}