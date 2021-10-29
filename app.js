const e = require('cors');
const express = require('express');
const app = express();
const port = 3000;
const expressHandlebars = require('express-handlebars');
const http = require('http');
const server = http.createServer(app);

var io = require('socket.io')(server);
var userArray = [];
let db_chat = [];
let db_room_chat = []
io.on("connection",function(socket) {
    console.log("co nguoi ket noi" + socket.id);

    socket.on("disconnect",function(){
        console.log(socket.id + " đã ngat ket noi");
        userArray = userArray.filter(e => e.id !== socket.id);
        console.log(userArray);
    })
    socket.on("logout-user", function() {
        userArray = userArray.filter(e => e.id !== socket.id);
        console.log(userArray);
        io.sockets.emit("user-online",userArray);
        socket.emit("logout-successful");
    })
    socket.on("private-message", (data) => {
        let id_socket = userArray.filter(item => {
            return item.name == data.to
        });
        db_chat.push(data);
        if(id_socket != "") {
            socket.to(id_socket[0].id).emit("private messages",  data);
        }
    });
    socket.on("login-user",function(data){
        if (userArray != "") {
            var ckeck = userArray.find(item => item.name === data);
            if(ckeck) {
                console.log(userArray);
                socket.emit("login-unsuccessfull");
            } else {
                let info = {
                    id: socket.id,
                    name:data
                }
                userArray.push(info);
                socket.emit("login-successfull", data);
                io.sockets.emit("user-online", userArray);
                socket.username = data;
                console.log(userArray);
            }
        } else {
            let info = {
                id: socket.id,
                name:data
            }
            userArray.push(info);
            socket.emit("login-successfull",(data));
            io.sockets.emit("user-online", userArray);
            socket.username = data;
            console.log(userArray);
        }
    })
    socket.on("get-db",function(curr) {
        let tmp = db_chat.filter(item => {
            if((item.from == curr || item.to == curr) && (item.from == socket.username || item.to == socket.username)) {
                return item
            }
        })
        socket.emit("get-db", tmp);
    })
    socket.on("create-room", function(data) {
        socket.join(data.roomName);
        if(db_room_chat != "") {
            let flag = 0;
            db_room_chat.forEach(item => {
                if (item.roomName != data.roomName) {
                    flag += 1;
                }
                if (flag == db_room_chat.length) {
                    flag += 1;
                    db_room_chat.push(data);
                    socket.emit("successful-room-creation",socket.username,data.roomName , data.users.length)
                    data.users.forEach(userRoom => {
                        userArray.forEach(user => {
                            if(userRoom == user.name) {
                                socket.to(user.id).emit("successful-room-creation",socket.username,data.roomName , data.users.length);
                            }
                        })
                    })
                }
            })
            if (flag < db_room_chat.length) {
                socket.emit("room-creation-failed");
            }
        } else {
            db_room_chat.push(data);
            socket.emit("successful-room-creation",socket.username,data.roomName , data.users.length)
            data.users.forEach(userRoom => {
                userArray.forEach(user => {
                    console.log("id" , userRoom);
                    if(userRoom == user.name) {
                        socket.to(user.id).emit("successful-room-creation",socket.username,data.roomName , data.users.length);
                    }
                })
            })
        }
        console.log(socket.adapter.rooms);
        console.log(db_room_chat)
    })
    socket.on("get-db-room", function(curr) {
        let tmp = db_room_chat.filter(item => item.roomName == curr)
        socket.emit("get-db-room", tmp);
    })
    socket.on("gruop-messages" , function(data) {
        db_room_chat.forEach(item => {
            if(item.roomName == data.to) {
                item.msgs.push(data);
            }
        })
        console.log(db_room_chat);
        io.sockets.in(data.to).emit("gruop-messages",data);
    })
    socket.on("join-room", function(roomName) {
        socket.join(roomName);
    })
    socket.on("get-db-room-name", function(user) {
        let room = [];
        db_room_chat.forEach(item => {
            item.users.forEach(item2 => {
                if(item2 == user) {
                    let tmp = {
                        "name" : item.roomName,
                        "length" : item.users.length
                    }
                    room.push(tmp);
                }
            })
        })
        console.log(room);
        socket.emit("get-db-room-name",room);
    })
})
app.use(express.static("public"));
// configure Handlebars view engine
app.engine('handlebars', expressHandlebars({
    defaultLayout: 'main',
}))
app.set('view engine', 'handlebars');

// methods
app.get('/', (req, res) => {
    res.render('chat');
})

// custom 404 page
app.use((req, res) => {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
})

// custom 500 page
app.use((err, req, res, next) => {
    console.error(err.message)
    res.type('text/plain')
    res.status(500)
    res.send('500 - Server Error')
})

server.listen(port, () => console.log(`Express started on http://localhost:${port};` + `press Ctrl-C to terminate. `))