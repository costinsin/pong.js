let socket;

let dataRecieved = false;
let controlledPad;
let score;

let pads = [], ball;

function setup() {
    createCanvas(800, 600);

    socket = io.connect(window.location.href);
    socket.on('heartbeat', function (data) {
        pads[1] = new Pad(data.pads[1].x, data.pads[1].y, data.pads[1].w, data.pads[1].h);
        pads[2] = new Pad(data.pads[2].x, data.pads[2].y, data.pads[2].w, data.pads[2].h);
        ball = new Ball(data.ball.x, data.ball.y, data.ball.r, createVector(data.ball.direction.x, data.ball.direction.y));
        score = data.score;
        //if (controlledPad > 0)
            //pads[controlledPad].y = mouseY;
        socket.emit('update', mouseY);
        if (pads.length !== 0)
            dataRecieved = true;
    });
    socket.on('login', function (pad, w, h) {
        controlledPad = pad;
        if (controlledPad > 0)
            console.log("You are player number " + controlledPad);
        else
            console.log("You are a spectator!");
        resizeCanvas(w, h);
    });
}

function Ball(x, y, r, vec) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.direction = vec;

    this.show = function () {
        fill(255);
        circle(x, y, r * 2);
    }
}

function Pad (x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.show = function () {
        rectMode(CENTER);
        fill(255);
        rect(this.x, this.y, this.width, this.height);
    }
}

function draw() {
    background(130);
    if (dataRecieved === true) {
        pads[1].show();
        pads[2].show();
        ball.show();

        if (score[1] !== undefined && score[1] !== null && score[2] !== undefined && score[2] !== null) {
            textAlign(CENTER);
            textSize(35);
            text(score[1] + ' - ' + score[2], width / 2, height * 20 / 100);
        } else {
            textAlign(CENTER);
            textSize(35);
            text("Wating for players to connect...", width / 2, height * 20 / 100);
        }

        if (ball.direction.x === 0 && ball.direction.y === 0) {
            textSize(35);
            textAlign(CENTER);
            text("Press SPACE to start the game.", width / 2, height * 80 / 100);
        }
    }

    if (keyIsPressed === true && keyCode === 32) {
        socket.emit('startgame');
    }
}