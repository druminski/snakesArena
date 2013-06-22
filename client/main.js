model = new Meteor.Collection("model");

BLOCK_SIZE = 10;
arenaWidth = MAX_ARENA_COLUMNS*BLOCK_SIZE;
arenaHeight = MAX_ARENA_ROWS*BLOCK_SIZE;
radiusForElelementAtArena = BLOCK_SIZE/2;

var lblJoinToRoom = "Join to a room";
var lblExitFromRoom = "Exit";

var subscribeHandler;

Session.set("desc", "Control by arrows");

Template.room.events({

    'click #btnJoinToRoom':function(){
        handleJoinToRoomOrExitFromRoom();
    },

    'keydown #txtNickname':function (event){
        if (event.keyCode == 13) {                  //when press enter
            handleJoinToRoomOrExitFromRoom();
        }
    },

    'click #btnReadyToPlay':function(){
        startGameIfAdmin();
    }

});

var handleJoinToRoomOrExitFromRoom = function() {
    if ($('#btnJoinToRoom').attr('value') == lblJoinToRoom) {
        Meteor.call('isRoomFree', getRoomId(), getPlayerName(), function (error, result) {
            if (result === true) {
                joinToRoom();
            }
            else if (result === false) {
                Session.set("desc", "Sorry but the room is not free. Try again in a few minutes.");
            }
            else if (result === NOT_UNIQE_NICK_NAME){
                Session.set("desc", "Please change your nickname because it is not unique.");
            }
        });
    } else {
        exitFromRoom();
    }
}

var startGameIfAdmin = function() {
    Meteor.call("startGameIfAdmin", getRoomId(), getPlayerName(), handleError());
    $('#snakesArena').focus();
}

var joinToRoom = function() {
    var playerName = getPlayerName();
    var roomId = getRoomId();

    if (playerName.length > 0) {
        Meteor._debug("joining to room as " + playerName);
        modifyViewForJoinToRoom();
        subscribeRoom(roomId, playerName);
        observeRoom(roomId);
    }
}

var subscribeRoom = function(roomId, playerName) {
    Deps.autorun(function () {
        subscribeHandler = Meteor.subscribe("createOrJoinToRoom", roomId, playerName);
    });
}

var observeRoom = function(roomId) {
    model.find({roomId: roomId}).observe({
        changed: function (newDocument, oldDocument) {
            drawElementsOfTheGame(newDocument);
            setSessionVariables(newDocument);
        },
        added: function (newDocument) {
            Meteor._debug("Message from server (added): " + newDocument.snakes.length);
            drawElementsOfTheGame(newDocument);
            setSessionVariables(newDocument);
        }
    });
}

var setSessionVariables = function(room) {
    Session.set("snakes", room.snakes);
    Session.set("desc", room.info);
}

var exitFromRoom = function() {
    modifyViewForExitFromRoom();
    subscribeHandler.stop();
    Session.set("snakes", null);
}

var getPlayerName = function() {
    return $('#txtNickname').attr('value');
}

var getRoomId = function() {
    return 1;
}

var modifyViewForJoinToRoom = function(){
    $('#txtNickname').attr('disabled', 'disabled');
    $('#btnJoinToRoom').attr('value', lblExitFromRoom);
    $('#btnReadyToPlay').removeClass("disabled");
    $('#snakesArena').focus();
}

var modifyViewForExitFromRoom = function(){
    $('#txtNickname').removeAttr('disabled');
    $('#btnJoinToRoom').attr('value', lblJoinToRoom);
    $('#btnReadyToPlay').addClass("disabled");
    cleanArena();
}

var handleError = function(error, result) {
    if (error != undefined) {
        //TODO handle error more elegant
        throw new Meteor.Error(1001, error);
    }
}

Template.arena.events({
    'keydown #snakesArena':function (event) {
        switch(event.keyCode) {
            case 37:
                Meteor.call("changeSnakeDirection", getRoomId(), getPlayerName(), DIRECTION.LEFT, handleError);
                Meteor._debug("You pressed left");
                break;
            case 38:
                Meteor.call("changeSnakeDirection", getRoomId(), getPlayerName(), DIRECTION.UP, handleError);
                Meteor._debug("You pressed up");
                break;
            case 39:
                Meteor.call("changeSnakeDirection", getRoomId(), getPlayerName(), DIRECTION.RIGHT, handleError);
                Meteor._debug("You pressed right");
                break;
            case 40:
                Meteor.call("changeSnakeDirection", getRoomId(), getPlayerName(), DIRECTION.DOWN, handleError);
                Meteor._debug("You pressed down");
                break;
        }
    }
});

Template.players.snakes = function () {
    return Session.get("snakes")
};

Template.desc.info = function() {
    return Session.get("desc");
};

Template.arena.arenaWidth = function() {
    return arenaWidth+"px";
};

Template.arena.arenaHeight = function() {
    return arenaHeight+"px";
};

Template.menus.menusStyle = function() {
    return "margin-left:"+arenaWidth+"px";
}