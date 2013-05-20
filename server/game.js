model = new Meteor.Collection(); //collection without a name is not persisted!

Meteor.methods({

    startGameIfAdmin: function (roomId, playerName) {
        if (ifGameStatusIsPauseAndAdminIsModifierThenChangeGameStatusToPlaying(roomId, playerName)) {
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
    }

})

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
            handleCollisions(snakes);
            model.update({roomId : roomId}, {$set : {snakes : snakes, fruit : room.fruit}});
        }

    }, TIME_TO_WAIT_FOR_NEXT_ITERATION_IN_GAME);
}

var isGameStatusEqualsEnd = function(roomId) {
    var room = model.findOne({roomId : roomId});
    return room.gameStatus == GAME_STATUS.END;
}

var endGame = function(roomId, interval) {
    Meteor.clearInterval(interval);
    //TODO winers and scores
}

var ifGameStatusIsPauseAndAdminIsModifierThenChangeGameStatusToPlaying = function(roomId, playerName) {
    var room = model.findOne({roomId : roomId});
    if (room.roomAdmin == playerName && room.gameStatus == GAME_STATUS.PAUSE) {
        model.update({roomId : roomId}, {$set : {gameStatus : GAME_STATUS.PLAYING}});
        Meteor._debug("playing")
        return true;
    }
    else {
        return false;
    }
}