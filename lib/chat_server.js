let socketio = require('socket.io'),
    io,
    guestNumber = 1,
    nickNames = {},
    namesUsed = [],
    currentRoom = {};

exports.listen = function(server){
    // socketio服务器搭建在已有的http服务上
    io = socketio(server,{
        serveClient: false
    });
    io.sockets.on('connection', function(socket){
        // 赋于新用户一个访客名
        guestNumber = assignGuestName(socket, guestNumber, nickNames,namesUsed);
        // 默认聊天室
        joinRoom(socket, 'defaultRoom');
        // 处理用户的消息
        handleMessageBroadcasting(socket, nickNames);
        // 改名
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        // 聊天室的创建、变更
        handleRoomJoining(socket);
        // // 提供当前聊天室名称列表
        // socket.on('rooms', function(){
        //     socket.emit('rooms',io.sockets.adapter.rooms);
        // })
        // 用户断开清楚逻辑
        handleClientDisconnection(socket,nickNames, namesUsed);
    })
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    let name = `Guest${guestNumber}`;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success: true,
        name
    });
    namesUsed.push(name);
    return ++guestNumber
}

function joinRoom(socket, room) {
    socket.join(room);
    // 记录用户当前房间
    currentRoom[socket.id] = room;
    // 通知用户成功进入新的房间
    socket.emit('joinResult', {room});
    // 通知房间里其他同户新用户加入
    socket.to(room).emit('message',{
        text: `${nickNames[socket.id]} has joined ${room}.`
    })
    // 房间用户数大于1 进行汇总
    io.sockets.in(room).clients((err,clients)=>{
        let len = clients.length
        if(len > 1){
            let usersInRoomSummary = `Users cuurently in ${room}:`;
            clients.forEach((userSocketId,index) => {
                if(userSocketId != socket.id) {
                    usersInRoomSummary += nickNames[userSocketId];
                    if (len != (index+2)) {
                        usersInRoomSummary += ',';
                    }
                }
            });
            usersInRoomSummary += '.';
            socket.emit('message', {text:usersInRoomSummary}); 
        }
    });
    // 新创建房间通知客户端
    io.sockets.emit('rooms',[...new Set(Object.values(currentRoom))]);
}

function handleNameChangeAttempts(socket,nickNames,namesUsed) {
    socket.on('nameAttempt', function(name){
        if (name.indexOf('Guest') > -1){
            socket.emit('nameResult',{
                success:false,
                message:"Names cannot begin with 'Guest'"
            });
        } else {
            if (namesUsed.includes(name)){
                socket.emit('nameResult',{
                    success:false,
                    message: 'This name is already in use!'
                });
            } else {
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(name);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                namesUsed.splice(previousNameIndex,1);
                socket.emit('nameResult',{
                    success:true,
                    name
                })
                socket.to(currentRoom[socket.id]).emit('message',{
                    text: `${previousName} is now known as ${name}.`
                })
            }
        }
    })
}

function handleMessageBroadcasting(socket, nickNames) {
    socket.on('message',function(message){
        socket.to(message.room).emit('message',{
            text: `${nickNames[socket.id]}:${message.text}`
        })
    })
}

function handleRoomJoining(socket) {
    socket.on('join',function(room){
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}

function handleClientDisconnection(socket, nickNames, namesUsed) {
    socket.on('disconnect',function(){
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        namesUsed.splice(nameIndex,1);
        delete nickNames[socket.id];
    })
}