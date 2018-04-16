function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}

function divSystemContentElement(message){
    return $('<div></div>').html('<i>'+message+'</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;

    if (message.chatAt(0) === '/') {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $('#messages').append((divSystemContenroomtElement(message)));
        }
    } else {
        chatApp.sendMessage($('#room').text(),message);
        $('#message').append(divEscapedContentElement(message))
                    .scrollTop($('#message').prop('scrollHeight'))
    }

    $('#send-message').val('');
}

var socket = io.connect();

$(function(){
    var chatApp = new Chat(socket);

    // 命名
    socket.on('nameResult',function(result){
        var message;
        if (result.success) {
            message = 'You are know as ' + result.name + '.';
        } else {
            message = result.message;
        }
        $('#message').append(divSystemContentElement(message));
    })

    // 房间信息
    socket.on('joinResult',function(result){
        $('#room').text(result.room);
        $('#message').append(divSystemContentElement('Room changed!'));
    })

    // 聊天信息
    socket.on('message', function(result){
        $('#message').append(divEscapedContentElement(result.text));
    })

    // 房间信息
    socket.on('rooms',function(rooms){
        $('#room-list').empty()
        for (var room in rooms) {
            room = room.slice(1,room.length);
            if (room) {
                $('#room-list').append(divEscapedContentElement(room)); 
            }
        }
    })

    // 代理切换房间事件
    $('#room-list').on("click",'div', function(){
        var roomName = $(this).text();
        chatApp.processCommand('/join '+roomName);
        $('#send-message').focus();
    })

    // 定时刷新可用房间列表
    // setInterval(function(){
    //     socket.emit('rooms');
    // },1000);

    // 默认锁定输入框
    $('#send-message').focus();

    // 默认请求一次
    $('#send-form').submit(function(){
        processUserInput(chatApp,socket);
        return false;
    })
})