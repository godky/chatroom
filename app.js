let http = require('http'),
    fs   = require('fs'),
    path = require('path'),
    mime = require('mime'),
    chatServer = require('./lib/chat_server'),
    cache= {};

function send404(res) {
    res.writeHead(404,{"Content-Type":'text/plain'});
    res.write('Error 404: resource not found');
    res.end();
}

function send500(res) {
    res.writeHead(500,{"Content-Type":'text/plain'});
    res.write('Error 500: server occur wrong');
    res.end();
}

function sendfile(res, filePath, fileContents) {
    res.writeHead('200',{
        "Content-Type": mime.getType(path.basename(filePath))
    });
    res.end(fileContents);
}

function serveStatic(res, cache, absPath) {
    if (cache[absPath]) {
        sendfile(res,absPath,cache[absPath])
    } else {
        fs.readFile(absPath,{encoding:'utf8'},function(err,data){
            if (err) {
                send404(res);
            } else {
                // cache[absPath] = data;
                sendfile(res,absPath, data);
            }
        })
    }
}

let server = http.createServer();
server.on('request',function(req,res){
    let filePath = ''
    if (req.url == '/') {
        filePath = 'public/index.html'
    } else {
        filePath = 'public'+ req.url;
    }
    let absPath = path.resolve(__dirname,filePath);
    serveStatic(res,cache,absPath);
});

chatServer.listen(server);

server.listen(5000,function(){
    console.log('server listening on port 5000')
});