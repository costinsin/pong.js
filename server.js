let path = require('path');
// Using express: http://expressjs.com/
let express = require('express');
// Create the app
let app = express();

// Set up the server
// process.env.PORT is related to deploying on heroku
let server = app.listen(process.env.PORT || 5000, listen);

// This call back just tells us that the server has started
function listen() {
    let port = server.address().port;
    console.log('Server started on port: ' + port);
}

app.use('/game', express.static(__dirname + '/game'));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket Portion
// WebSockets work with the HTTP server
let io = require('socket.io')(server);

let width = 1200, height = 600;

let padlink = {};
let pads = [];
pads[1] = {'x': 30, 'y': height / 2, 'w': width / 30, 'h': height / 4};
pads[2] = {'x': width - 30, 'y': height / 2, 'w': width / 30, 'h': height / 4};

let ball = {'x': width / 2, 'y': height / 2, 'r': 15 , 'direction': {'x': 0, 'y': 0}};
let ballSpeed = 9;

let score = [];

let gameState = 'not started';

function heartbeat() {
    io.sockets.emit('heartbeat', {pads, ball, score});
}
setInterval(heartbeat, 7);

let circleRect = function (cx, cy, radius, rx, ry, rw, rh) {
    let xn = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
    let yn = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));

    let distX = cx - xn;
    let distY = cy - yn;

    return {'condtition': (distX*distX) + (distY*distY) < radius * radius, 'dist': Math.sqrt((distX*distX) + (distY*distY)) - radius};
}

function updateBall() {
    let compute;
    compute = circleRect(ball.x, ball.y, ball.r, pads[1].x, pads[1].y, pads[1].w, pads[1].h);
    if (compute.condtition && compute.dist < pads[1].w / 2) {
        ball.direction.x *= -1;
        let mapToAngle = map(ball.y, pads[1].y - pads[1].h / 2, pads[1].y + pads[1].h / 2, -0.85, 0.85);
        ball.direction.y = mapToAngle;
    }
    compute = circleRect(ball.x, ball.y, ball.r, pads[2].x, pads[2].y, pads[2].w, pads[2].h);
    if (compute.condtition && compute.dist < pads[2].w / 2) {
        ball.direction.x *= -1;
        let mapToAngle = map(ball.y, pads[2].y - pads[2].h / 2, pads[2].y + pads[2].h / 2, -0.85, 0.85);
        ball.direction.y = mapToAngle;
    }
    if (ball.y - ball.r < 0 || ball.y + ball.r > height)
        ball.direction.y *= -1;
    ball.x = ball.x + (ball.direction.x * ballSpeed);
    ball.y = ball.y + (ball.direction.y * ballSpeed);
}
setInterval(updateBall, 7);

function loseCheck() {
    if (ball.x - ball.r < 0) {
        ball = {'x': width / 2, 'y': height / 2, 'r': 15, 'direction': {'x': 0, 'y': 0}};
        gameState = 'not started';
        score[2]++;
    } else if (ball.x + ball.r > width) {
        ball = {'x': width / 2, 'y': height / 2, 'r': 15, 'direction': {'x': 0, 'y': 0}};
        gameState = 'not started';
        score[1]++;
    }
}
setInterval(loseCheck, 7);

let valueExist = function (dict, value) {
    for (let i in dict) {
        if (dict.hasOwnProperty(i) && value === dict[i])
            return true;
    }
    return false;
}

let map = function (value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

io.sockets.on(
    'connection',
    function(socket) {
        console.log('A client connected with socket-id: ' + socket.id);
        if (!valueExist(padlink, 1)) {
            padlink[socket.id] = 1;
            score[1] = score[2] = 0;
            socket.emit('login', 1, width, height);
        } else if (!valueExist(padlink, 2)) {
            padlink[socket.id] = 2;
            score[1] = score[2] = 0;
            socket.emit('login', 2, width, height);
        } else
            socket.emit('login', 0, width, height)

        socket.on('update', function (mouseY) {
            if (padlink.hasOwnProperty(socket.id)) {
                pads[padlink[socket.id]].y = mouseY;
            }
        });

        socket.on('startgame', function () {
            if (gameState === 'not started' && padlink[socket.id] !== undefined) {
                let rng = [-1, 1];
                ball.direction.x = rng[Math.floor(Math.random() * 1.999)];
                gameState = 'started';
            }
        });

        socket.on('disconnect', function() {
            console.log('Client with socket-id ' + socket.id + ' has disconnected');
            if (padlink[socket.id] !== undefined) {
                score[padlink[socket.id]] = undefined;
            }
            delete padlink[socket.id];
        });
    }
);