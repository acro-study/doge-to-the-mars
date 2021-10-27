(function () {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    // Set size of canvas
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    var timer = 0;
    var animation = null;
    var objects = [];
    var doge = null;
    var maxSpeed = canvas.width / 80;
    var speed = maxSpeed / 3;
    var score = 0;
    var bgImage = new Image();
    var bgShift = 0;
    bgImage.src = "images/background.png";

    class Unit {
        constructor() {
            this.width = canvas.width / 20;
            this.height = this.width;
            this.x = canvas.width - this.width;
            this.y = canvas.height - this.height;
            this.dx = 0;
            this.dy = 0;
        }
    }

    class Floater extends Unit {
        constructor() {
            super();
            this.y = getRandomInt(0, canvas.height - this.height);
            this.dx = speed * -1;
            this.visible = true;
        }
        move() {
            this.x += this.dx;
        }
    }

    class Doge extends Unit {
        constructor() {
            super();
            this.width = canvas.width / 8;
            this.height = this.width / 2;
            this.x = 10;
            this.y = 0;
            this.dy = speed;
            this.direction = 1;
            this.image = new Image();
            this.image.src = 'images/doge-on-rocket.png';
            this.degree = 5;

            (function (doge) {
                document.addEventListener('keydown', (e) => {
                    if (e.code == 'Space') {
                        doge.toggleDirection();
                    }
                })
                document.addEventListener('click', () => doge.toggleDirection())
                document.addEventListener('touchend', () => doge.toggleDirection())
            })(this)
        }
        draw() {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.degree*Math.PI/180);
            ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        move() {
            if (this.direction > 0 && this.y < canvas.height - this.height) {
                this.y += (this.dy * this.direction);
            } else if (this.direction < 0 && this.y > 0) {
                this.y += (this.dy * this.direction);
            }
            this.degree = 5 * this.direction;
        }
        toggleDirection() {
            this.direction *= -1;
        }
        speedUp() {
            this.dy = speed;
        }
        collisionDetect(unit) {
            var xDiff = unit.x - (this.x + this.width);
            var yBottomDiff = unit.y - (this.y + this.height);
            var yTopDiff = this.y - (unit.y + unit.height);
            if (xDiff < 0 && yBottomDiff < 0 && yTopDiff < 0) return true;
            return false;
        }
    }

    class Coin extends Floater {
        constructor() {
            super();
            this.image = new Image();
            this.image.src = 'images/coin.png';
        }
        draw() {
            ctx.save();
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }

    class Obstacle extends Floater {
        constructor() {
            super();
            this.image = new Image();
            this.image.src = 'images/wastepaper.png';
            this.image.className = 'rotate';
            this.degree = 0;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x + this.width/2, this.y + this.height/2);
            ctx.rotate(this.degree*Math.PI/180);
            ctx.translate(-(this.x + this.width/2), -(this.y + this.height/2));
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        move() {
            this.x += this.dx;
            this.degree = (this.degree + 1) % 360;
        }
    }

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function drawScore() {
        ctx.save();
        ctx.font = `${canvas.width / 30}px Arial`;
        ctx.fillStyle = "white";
        ctx.textBaseline = 'top';
        ctx.textAlign = 'right';
        ctx.fillText('score: ' + score, canvas.width - 20, 20);
        ctx.restore();
    }

    function drawBackground() {
        ctx.save();
        ctx.drawImage(bgImage, -bgShift, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImage, canvas.width - bgShift, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    function drawEnding() {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = `${canvas.width / 20}px Arial`;
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        ctx.fillText("Game over", canvas.width/2, canvas.height/2);
        ctx.font = `${canvas.width / 40}px Arial`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.fillText("click/tab for restart", canvas.width/2, canvas.height/2);
        ctx.restore();
    }

    function loop() {
        animation = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        timer++;

        drawBackground();
        drawScore();

        bgShift = (bgShift + speed / 4) % canvas.width;

        if (timer % 60 === 0) {
            score++;
        }

        if (timer % (120 + getRandomInt(-10, 10)) === 0) {
            objects.push(new Obstacle());
        }

        if (timer % (300 + getRandomInt(-30, 30)) === 0) {
            objects.push(new Coin());
        }

        if (timer % 1000 === 0 && speed <= maxSpeed) {
            speed++;
            doge.speedUp();
        }

        objects.forEach((object, e, i) => {
            if (object.x < 0 || !object.visible) {
                objects.splice(i, 1);
            }
        })

        objects.forEach((object, e, i) => {
            if (doge.collisionDetect(object)) {
                if (object instanceof Coin) {
                    score += 100;
                    object.visible = false;
                } else if (object instanceof Obstacle) {
                    cancelAnimationFrame(animation);
                    drawEnding();
                    document.addEventListener('keydown', () => window.location.reload())
                    document.addEventListener('click', () => window.location.reload())
                    document.addEventListener('touchend', () => window.location.reload())
                }
            }
            object.move();
            object.draw();
        })

        doge.move();
        doge.draw();
    }

    doge = new Doge();
    loop(); // start loop
})()