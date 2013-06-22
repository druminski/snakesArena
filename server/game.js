model = new Meteor.Collection(); //collection without a name is not persisted!

MAX_PLAYERS_IN_A_ROOM=8;

Meteor.methods({

    startGameIfAdmin: function (roomId, playerName) {
        if (ifGameStatusIsEndAndAdminIsModifierThenChangeGameStatusToPlaying(roomId, playerName)) {
            resetSnakesGameData(roomId);
            runGame(roomId);
        }
    },

    changeSnakeDirection: function (roomId, playerName, direction) {
        var snakes = model.findOne({roomId : roomId}).snakes;
        var snakesNames = _.pluck(snakes, 'name');
        var indexOfSnakeToModify = _.indexOf(snakesNames, playerName);

        if (!isOppositeDirection(snakes[indexOfSnakeToModify].direction, direction)){
            // model.update({roomId : roomId, 'snakes.name' : playerName}, {$set: {'snakes.$.direction' : direction}}, { multi: false });
            // minimongo doesn't yet support $ in modifier. as a temporary
            // workaround, make a modifier that uses an index. this is
            // safe on the client since there's only one thread.
            // https://github.com/meteor/meteor/issues/503

            var modifier = {$set: {}};
            modifier.$set["snakes." + indexOfSnakeToModify + ".newDirection"] = direction;
            model.update({roomId : roomId}, modifier);

            Meteor._debug("updating");
        }
    },

    isRoomFree: function (roomId, playerName) {
        var result = true;

        var room = model.findOne({roomId : roomId});
        if (room && room.snakes && room.snakes.length >= MAX_PLAYERS_IN_A_ROOM) {
            result = false;
        }
        else if (room && room.snakes && room.snakes.length > 0 && !isPlayerNameUniqueForTheRoom(playerName, room.snakes)) {
            result = NOT_UNIQE_NICK_NAME;
        }

        return result;
    }

})

var isPlayerNameUniqueForTheRoom = function(playerName, snakes) {
    var result = true;
    for (var index=0; index < snakes.length; index++) {
        if (snakes[index].name === playerName) {
            result = false;
            break;
        }
    }
    return result;
}

var runGame = function(roomId) {
    var TIME_TO_WAIT_FOR_NEXT_ITERATION_IN_GAME = 100;
    var interval = Meteor.setInterval(function () {

        if (!isRoomExist(roomId)) {
            Meteor.clearInterval(interval);
            Meteor._debug("Stopping game for room " + roomId);
        }
        else if (isGameStatusEqualsEnd(roomId)) {
            endGame(roomId, interval);
        }
        else {
            var room = model.findOne({roomId : roomId});
            var snakes = room.snakes;
            moveSnakesPositions(snakes);
            handleTeleport(snakes);
            handleFruits(room, snakes);
            handleCollisions(room, snakes);
            model.update({roomId : roomId}, {$set : {
                snakes : snakes,
                info : room.info,
                fruit : room.fruit,
                gameStatus : getGameStatus(snakes)
            }});
        }

    }, TIME_TO_WAIT_FOR_NEXT_ITERATION_IN_GAME);
}

var getGameStatus = function(snakes) {
    var gameStatus = GAME_STATUS.END;
    for (var index=0; index < snakes.length; index++) {
        if (snakes[index].status == GAME_STATUS.PLAYING) {
            gameStatus = GAME_STATUS.PLAYING;
            break;
        }
    }
    return gameStatus;
}

var isGameStatusEqualsEnd = function(roomId) {
    var room = model.findOne({roomId : roomId});
    return room.gameStatus == GAME_STATUS.END;
}

var endGame = function(roomId, interval) {
    Meteor.clearInterval(interval);
    Meteor._debug("ending game");
    resetSnakesGameData(roomId);
    //TODO winers and scores
}

var ifGameStatusIsEndAndAdminIsModifierThenChangeGameStatusToPlaying = function(roomId, playerName) {
    var room = model.findOne({roomId : roomId});
    if (room.roomAdmin == playerName && room.gameStatus == GAME_STATUS.END) {
        model.update({roomId : roomId}, {$set : {
            gameStatus : GAME_STATUS.PLAYING,
            snakes: getSnakesWithChangedStatus(room.snakes, GAME_STATUS.PLAYING)
        }});
        Meteor._debug("playing")
        return true;
    }
    else {
        return false;
    }
}

