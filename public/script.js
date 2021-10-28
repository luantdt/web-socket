const userArray = ['User1','User2','User3','User4','User5','User6'];
let user = "";
let curr_user = "";
let db_chat = [];
let db_room_chat = [];
let isRoom = false;
//code socket here
var socket = io("http://localhost:3000/");
socket.on("login-unsuccessfull",function(){
    alert("There are already other machines using this user. Please choose another account");
})
socket.on("user-online", function(data) {
    let userOnline = data;
    let userOffline = userArray;
    let a =[]
    userOnline.forEach(function(item) {
        if(item.name != user) {
            let a = "#" + item.name;
            $(a).addClass("online");
            $(a).html('<i class="bi bi-dot"></i> Online')
        };
        userOffline = userOffline.filter(i => i !== item.name);
    });  
    userOffline.forEach(function(item) {
        let a = "#" + item;
        $(a).removeClass("online");
        $(a).html('<i class="bi bi-dot"></i> Offline')   
    });
});

socket.on("login-successfull",function(data){
    alert("Logged in successfully");
    $("#form-login").hide(1000);
    $("#form-chat").css("visibility","visible");
    user = data;
    let tmp = `<div class="acc font p-2 mb-3 rounded"> 
            <div id="acc">Your account: ${data}</div>
            <button type="button" class="m-2 btn btn-danger" onclick="logoutUser()">Log out</button>
        </div>`
    tmp += userArray.filter(e => e !== data).map((item ,index) => { 
        if (index === 0) {
            return `<div class=" font p-2 border border-3 checked" id="detail">
                    <div class="name">${item}</div>
                    <div class="sts" id=${item}><i class="bi bi-dot"></i> Offline</div>
                </div>`
        } else {
            return `<div class=" font p-2 border border-3" id="detail">
                <div class="name">${item}</div>
                <div class="sts" id=${item}><i class="bi bi-dot"></i> Offline</div>
            </div>`
        }
    })
    $("#cont-acc").html(tmp.replaceAll(',', ''));
    curr_user = $(".checked .name").text();
    socket.emit("get-db", curr_user);
    socket.emit("get-db-room-name", user);
})
socket.on("get-db-room",function(data){
    let msg = "";
    console.log(data);
    if(data.length > 0 ) {
        msg = data[0].msgs.map(item => {
            console.log(item);
            if(item.from == user) {
                return `<div class="item-message current-user">${item.msg}</div>`
            } else {
                return `<div class="item-message">${item.msg}</div>`;
            }
            return "";
        })
    }
    $("#mess").html(msg);
})
socket.on("get-db-room-name", function(data) {
    if (data.length > 0) {
        data.forEach(item => {
            let tmp = `<div class="font p-2 border border-3 room" id="detail">
                        <div class="name">${item.name}</div>
                        <div class="sts" id=${item.name}><i class="bi bi-dot"></i> ${item.length} user</div>
                    </div>`;
            $("#cont-acc").append(tmp);     
        })
    }
})
socket.on("logout-successful", function() {
    alert("Log out was successful");
    $("#form-login").css("display","block");
    $("#form-chat").css("visibility","hidden");
})
socket.on("private messages", (data) => {
    if (data.to == user && data.from == curr_user) {
        $("#mess").append(`<div class="item-message">${data.msg}</div>`)
    }
    console.log(data.from);
})
socket.on("gruop-messages", function(data) {
    if (curr_user == data.to) {
        if (data.from != user) {
            $("#mess").append(`<div class="item-message">${data.msg}</div>`)
        }
    }
})
socket.on("get-db", function(data) {
    db_chat = data;
    let msg = db_chat.map(item => {
        if(item.from == user && item.to == curr_user) {
            return `<div class="item-message current-user">${item.msg}</div>`
        }
        if(item.from == curr_user && item.to == user) {
            return `<div class="item-message">${item.msg}</div>`;
        }
        return "";
    })
    $("#mess").html(msg);
})
socket.on("room-creation-failed", function() {
    alert("room creation failed. Room name already exists, you need to enter other room name");
})
socket.on("successful-room-creation", function(inviter, room, length) {
    if (inviter == user) {
        closeFormCreate();
        alert("Room creation was successful");
    } else {
        alert("you have been invited to the room" + room);
    }
    let tmp = `<div class="font p-2 border border-3 room" id="detail">
                <div class="name">${room}</div>
                <div class="sts" id=${room}><i class="bi bi-dot"></i> ${length} user</div>
            </div>`;
    $("#cont-acc").append(tmp);
})


// function here
$(document).ready(function(){
    $(document).on('click', '#detail', function() {
        $(".checked").removeClass("checked");
        $(this).addClass("checked");
        curr_user = $('.checked .name').text();
        if ($(this).hasClass("room")) {
            isRoom = true;
            socket.emit("join-room", curr_user);
            socket.emit("get-db-room",curr_user);
        } else {
            isRoom = false;
            socket.emit("get-db",curr_user);
        }
        
    });
});
function loginUser(e) {
    socket.emit("login-user", e.textContent);
}
function logoutUser() {
    socket.emit("logout-user");
}
function sendMessage() {
    let data = {
        "from": user,
        "to": curr_user,
        "msg": $("#messages").val()
    }
    $("#mess").append(`<div class="item-message current-user">${data.msg}</div>`)
    $("#messages").val("");
    if(isRoom) {
        socket.emit("gruop-messages", data);
    } else {
        socket.emit("private-message", data);
    }
}
function showFormCreate() {
    $(".blur").css("visibility","visible");
}
function closeFormCreate() {
    $(".blur").css("visibility","hidden");
}
function createRoom() {
    var usr = []
    $.each($("input[name='Users']:checked"), function(){
        usr.push($(this).val());
    });
    let data = {
        "roomName": $("#rn").val(),
        "users": usr,
        "msgs": []
    }
    $("#messages").val("");
    socket.emit("create-room",data);
}