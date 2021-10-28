(function () {
    var playBtn = document.getElementById('play-btn');
    var pauseBtn = document.getElementById('pause-btn');
    var scoreText = document.getElementById('score-text');
    var gameoverOverlay = document.getElementById('gameover-overlay');
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
            this.resize()
            this.x = canvas.width - this.width;
            this.y = canvas.height - this.height;
            this.dx = 0;
            this.dy = 0;
        }
        resize() {
            this.width = canvas.width / 20;
            this.height = this.width;
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
            this.y += (this.dy * this.direction);
            if (this.y >= canvas.height - this.height) {
                this.y = canvas.height - this.height;
            } else if (this.y <= 0) {
                this.y = 0;
            }
            this.degree = 5 * this.direction;
        }
        toggleDirection() {
            this.direction *= -1;
        }
        collisionDetect(unit) {
            var xDiff = unit.x - (this.x + this.width);
            var yBottomDiff = unit.y - (this.y + this.height);
            var yTopDiff = this.y - (unit.y + unit.height);
            if (xDiff < 0 && yBottomDiff < 0 && yTopDiff < 0) return true;
            return false;
        }
        resize() {
            this.width = canvas.width / 8;
            this.height = this.width / 2;
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

    function debounce(func, delay) {
        let clearTimer;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(clearTimer);
            clearTimer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    function loop() {
        animation = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        timer++;

        // draw background
        ctx.save();
        var bgWidth = Math.max(canvas.width, canvas.height * (16/9));
        var bgHeight = Math.max(canvas.height, canvas.width * (9/16));
        ctx.drawImage(bgImage, -bgShift, 0, bgWidth, bgHeight);
        ctx.drawImage(bgImage, bgWidth - bgShift, 0, bgWidth, bgHeight);
        ctx.restore();
        bgShift = (bgShift + speed / 4) % bgWidth;

        if (timer % 60 === 0) {
            scoreText.innerHTML = score++;
        }

        if (timer % (120 + getRandomInt(-10, 10)) === 0) {
            objects.push(new Obstacle());
        }

        if (timer % (300 + getRandomInt(-30, 30)) === 0) {
            objects.push(new Coin());
        }

        if (timer % 1000 === 0 && speed <= maxSpeed) {
            doge.dy = speed++;
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
                    gameoverOverlay.classList.remove('hidden')
                    gameoverOverlay.classList.add('flex')
                    document.addEventListener('keydown', () => window.location.reload())
                    document.addEventListener('click', () => window.location.reload())
                }
            }
            object.move();
            object.draw();
        })

        doge.move();
        doge.draw();
    }

    // Set window resize callback with throttle
    window.addEventListener("resize", debounce(function () {
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // update unit size
        doge.resize();
        objects.forEach(function(o) {
            o.resize();
        })

        // TODO: calc speed dynamically
        maxSpeed = canvas.width / 80;
        speed = maxSpeed / 3;
    }, 200), false);


    // Set button click events
    playBtn.addEventListener('click', function () {
        this.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        loop();
    })
    pauseBtn.addEventListener('click', function () {
        this.classList.add('hidden');
        playBtn.classList.remove('hidden');
        cancelAnimationFrame(animation)
    })

    // For hides the address bar on mobile
    window.addEventListener("load",function() {
        setTimeout(function(){
            window.scrollTo(0, 1);
        }, 0);
    });

    // Init and start animation loop
    doge = new Doge();
    loop();
    window.dispatchEvent(new Event('resize'));
})()