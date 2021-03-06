Meteor.startup(function () {
    Meteor.publish("createOrJoinToRoom", createOrJoinToRoom);
});

createOrJoinToRoom = function(roomId, playerName){
    if (!isRoomExist(roomId)) {
        createRoom(roomId, playerName);
    }
    insertPlayerToRoom(roomId, playerName);
    publishRoomChanges(roomId, playerName, this);
}

isRoomExist = function(roomId) {
    var roomExist = false;
    if (model.find({roomId : roomId}).count() > 0) {
        roomExist = true;
    }
    return roomExist;
}

resetSnakesGameData = function (roomId){
    var snakes = model.findOne({roomId : roomId}).snakes;
    for (var index = 0; index < snakes.length; index++) {
        snakes[index] = getSnakeWithResetData(snakes[index]);
    }
    model.update({roomId : roomId}, {$set: {snakes : snakes}});
}

var publishRoomChanges = function(roomId, playerName, functionPublishRef) {
    var self = functionPublishRef;
    Meteor._debug("Observing room " + roomId);
    var collectionNameOnClientSite = "model";

    var document = model.findOne({roomId : roomId});
    self.added(collectionNameOnClientSite, document._id, document);
    self.ready();

    var observer = model.find({roomId : roomId}).observe({
        added: function (document) {
            Meteor._debug("Adding");
            self.added(collectionNameOnClientSite, document._id, document);
        },
        changed: function (newDocument, oldDocument) {
            self.changed(collectionNameOnClientSite, newDocument._id, newDocument);
        },
        removed: function (oldDocument) {
            Meteor._debug("Removing");
            self.removed(collectionNameOnClientSite, oldDocument._id);
        }
    });

    self.onStop(function () {
        Meteor._debug(playerName + " exit from a room");
        exitUserFromRoom(roomId, playerName, observer);
    });

    //when client close connection, for example by exit from the site then remove it from the room
    //TODO should try reconnect
    self._session.socket.on("close", function() {
        Meteor._debug("Socket closed for " + playerName);
        exitUserFromRoom(roomId, playerName, observer);
    });
}

var exitUserFromRoom = function(roomId, playerName, observer) {
    observer.stop();
    removeUserFromRoom(roomId, playerName);
    if (howManyPlayersInRoom(roomId) == 0){
        Meteor._debug("Removing room " + roomId);
        removeRoom(roomId);
    }
    else {
        changeAdminIfNecessary(roomId);
    }
}

var changeAdminIfNecessary = function(roomId) {
    var room = model.findOne({roomId : roomId});

    if (!isAdminExist(room)) {
        model.update({roomId : roomId}, {$set : {roomAdmin : room.snakes[0].name}});
    }
}

var isAdminExist = function(room) {
    var snakes = room.snakes;
    var adminName = room.roomAdmin;

    var adminExist = false;
    for (var index=0; index < snakes.length; index++) {
        if (snakes[index].name === adminName) {
            adminExist = true;
            break;
        }
    }
    return adminExist;
}

var howManyPlayersInRoom = function(roomId) {
    var snakes = model.findOne({roomId : roomId}).snakes;
    if (snakes == null) {
        return 0;
    }
    else {
        return snakes.length;
    }
}

var createRoom = function(roomId, adminName) {
    model.insert({
        roomId : roomId,
        roomAdmin : adminName,
        gameStatus : GAME_STATUS.END,
        info : "Control by arrows",
        fruit : getRandomPosition(MAX_ARENA_COLUMNS, MAX_ARENA_ROWS),
        snakes : [
        ]
    });
}

var removeUserFromRoom = function(roomId, playerName) {
    model.update({roomId : roomId}, {$pull : {snakes : {name : playerName}}});
}

var removeRoom = function(roomId) {
    model.remove({roomId : roomId}, 1);
}

var insertPlayerToRoom = function(roomId, playerName) {
    var howManySnakesInTheRoomWithNewSnake = howManyPlayersInRoom(roomId) + 1;
    Meteor._debug("Number of snakes in the room " + howManySnakesInTheRoomWithNewSnake);

    var snake = {
        name : playerName,
        color: getRandomColorAsString(),
        body : [
            {posX : howManySnakesInTheRoomWithNewSnake*DISTANCE_BETWEEN_SNAKES_AT_START + DISTANCE_BETWEEN_SNAKES_AT_START, posY : 28},
            {posX : howManySnakesInTheRoomWithNewSnake*DISTANCE_BETWEEN_SNAKES_AT_START + DISTANCE_BETWEEN_SNAKES_AT_START, posY : 20}
        ]
    }
    snake = getSnakeWithResetData(snake);
    model.update({roomId : roomId}, {$push: {snakes : snake}});
}

var getSnakeWithResetData = function (snake) {
    snake.lives = 5;
    snake.direction = DIRECTION.UP;
    snake.newDirection = DIRECTION.UP;
    snake.points = 0;
    snake.status = GAME_STATUS.PLAYING;
    snake.isSnakeInCollision = false;

    return snake;
}