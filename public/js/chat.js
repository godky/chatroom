var Chat = function(socket){
    this.socket = socket;
};

Chat.prototype.sendMessage = function(room, text){
    this.socket.emit('message',{
        room: room,
        text: text
    });
}

Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join',{
        newRoom: room
    });
}

Chat.prototype.processCommand = function(command) {
    var words = command.split(' ');
    var command = words[0].slice(1,words[0].length).toLowerCase();
    var message = false;

    words.shift();
    var str = words[0];
    console.log('command words',str)
    switch(command) {
        case 'join':
            this.changeRoom(str);
            break;
        case 'nick':
            this.socket.emit('nameAttempt',str);
            break;       
        default:
            message = 'Unrecognized command';
            break; 
    }
    return message;
}