function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}

function divSystemContentElement(message){
    return $('<div></div>').html('<i>'+message+'</i>');
}

function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    if(!message.trim()){
        alert('发送消息不能为空')
        return false
    }
    var systemMessage;
    if (message.charAt(0) === '/') {
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
            $('#name').text(result.name)
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
        rooms.forEach(rn => {
            $('#room-list').append(divEscapedContentElement(rn)); 
        });
    })

    // 代理切换房间事件
    $('#room-list').on("click",'div', function(){
        var roomName = $(this).text();
        if(roomName == $("#room").text()){
            $('#message').append(divSystemContentElement('You are already in this room!'));
        } else {
            chatApp.processCommand('/join '+roomName);
            $('#send-message').focus();
        }
        console.log(roomName)
    })

    // 定时刷新可用房间列表
    // setInterval(function(){
        // socket.emit('rooms');
    // },1000);

    // 默认锁定输入框
    $('#send-message').focus();

    // 发送事件
    $('#send-button').click(function(){
        processUserInput(chatApp,socket);
        return false;
    })

    // 键盘事件
    $("body").keyup(function(ev){
        if(ev.keyCode !== 13 && ev.keyCode !== 108) return false;
        processUserInput(chatApp,socket);
        return false;
    })
})