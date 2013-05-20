model = new Meteor.Collection("model"); //collection without a name is not persisted!

BLOCK_SIZE = 12;
arenaWidth = MAX_ARENA_COLUMNS*BLOCK_SIZE;
arenaHeight = MAX_ARENA_ROWS*BLOCK_SIZE;
radiusForElelementAtArena = BLOCK_SIZE/2;

var lblJoinToRoom = "Join to the game";
var lblExitFromRoom = "Exit";

var subscribeHandler;

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
        joinToRoom();
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
    model.find({roomId: roomId}).observeChanges({
        changed: function (id, fields) {
            drawElementsOfTheGame(roomId);
        },
        added: function (id, fields) {
            Meteor._debug("Message from server (added): " + model.findOne({roomId : roomId}).snakes.length);
            drawElementsOfTheGame(roomId);
        }
    });
}

var exitFromRoom = function() {
    modifyViewForExitFromRoom();
    subscribeHandler.stop();
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

Template.arena.arenaWidth = function() {
    return arenaWidth+"px";
};

Template.arena.arenaHeight = function() {
    return arenaHeight+"px";
};

Template.menus.menusStyle = function() {
    return "margin-left:"+arenaWidth+"px";
}