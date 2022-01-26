window.onload = function() {
    var camera, renderer, scene, pointLight, spotLight;

    // velikost canvasu
    const WIDTH = 886;
    const HEIGHT = 499;

    // velikost herní plochy
    var planeWidth = 400;
    var planeHeight = 200;
    var planeQuality = 10;

    var paddleWidth, paddleHeight, paddleDepth, paddleQuality;
    var paddlePlayerDirY = 0;
    var paddleAIDirY = 0;
    var paddleSpeed = 10;

    var ball, paddlePlayer, paddleAI;
    var ballDirX = 1,
        ballDirY = 1,
        maxBallSpeed = 3,
        ballSpeed = 1;

    // do kolika bodů se hraje
    var maxScore = 3;

    var scorePlayer = 0;
    var scoreAI = 0;

    //nastavení obtížnosti (0,1) 0 - nejlehčí, 1 - nejtěžší
    var difficulty = 0.5;

    var end = true;
    var playgroundTexture = "texture/playground.png";
    //ovládání pomocí kláves A,D
    var Key = {
        _pressed: {},
        A: 65,
        D: 68,
        isDown: function(keyCode) {
            return this._pressed[keyCode];
        },
        onKeydown: function(event) {
            this._pressed[event.keyCode] = true;
        },
        onKeyup: function(event) {
            delete this._pressed[event.keyCode];
        }
    };
    document.getElementById("alert").innerHTML = "Gain " + maxScore + " points to win!";

    //restartuje hru, vynuluje skóre
    function restartGame() {
        //náhodné určení prvotního směru míče
        resetBall(Math.floor(Math.random() * (2 - 1 + 1)) + 1);
        end = false;
        scorePlayer = 0;
        scoreAI = 0;
        document.getElementById("buttonWrapper").style.display = "none"
        document.getElementById("button").innerHTML = "Play again"
        document.getElementById("alert").innerHTML = "Gain " + maxScore + " points to win!";
        document.getElementById("scorePlayer").innerHTML = scorePlayer
        document.getElementById("scoreAI").innerHTML = scoreAI
    }

    //button pro (re)start hry
    document.getElementById('button').addEventListener('click', function(e) {
        restartGame()
    });

    init();
    animate();

    function init() {
        var canvas = document.getElementById("canvas");

        //nastavení kamery
        var VIEW_ANGLE = 60,
            ASPECT = WIDTH / HEIGHT,
            NEAR = 1,
            FAR = 10000;

        renderer = new THREE.WebGLRenderer({ antialias: true });
        camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

        scene = new THREE.Scene();

        // přidání kamery do scény
        scene.add(camera);

        // vyrendrování scény do canvasu
        renderer.setSize(WIDTH, HEIGHT);
        canvas.appendChild(renderer.domElement);

        // materiály jednotlivých objektů

        // stůl
        var tableMat = new THREE.MeshLambertMaterial({
            color: "rgb(38,15,0)"
        });
        // nohy stolu
        var tableLegMat = new THREE.MeshLambertMaterial({
            color: "rgb(15,5,0)"
        });
        // odrazové desky stolu
        var tableBorderMat = new THREE.MeshLambertMaterial({
            color: "rgb(64,64,64)"
        });
        // hrací plocha
        var planeMat = new THREE.MeshLambertMaterial({
            color: "rgb(13,45,0)"
        });
        Texture = new THREE.ImageUtils.loadTexture(playgroundTexture);
        var planeMat = new THREE.MeshLambertMaterial({ map: Texture });
        /*
        var planeMat = new THREE.MeshLambertMaterial({
            color: "rgb(13,45,0)"
        });
        */
        // hrací míč
        var sphereMaterial = new THREE.MeshLambertMaterial({
            color: "red"
        });
        // hráčova pálka
        var paddlePlayerMat = new THREE.MeshLambertMaterial({
            color: "rgb(0,90,255)"
        });
        // AI pálka
        var paddleAIMat = new THREE.MeshLambertMaterial({
            color: "orange"
        });

        // 3D objekty

        // model hracího stolu
        var table = new THREE.Mesh(
            new THREE.CubeGeometry(
                planeWidth,
                planeHeight * 1.03,
                20,
                planeQuality,
                planeQuality,
                1
            ),

            tableMat
        );
        table.position.z = -11;
        scene.add(table);
        table.receiveShadow = true;

        // model levé nohy stolu
        var tableLegLeft = new THREE.Mesh(
            new THREE.CubeGeometry(
                20,
                20,
                100,
                planeQuality,
                planeQuality,
                1
            ),

            tableLegMat
        );
        tableLegLeft.position.z = -71;
        tableLegLeft.position.x = -planeHeight * 0.94;
        tableLegLeft.position.y = planeWidth * 0.23;
        scene.add(tableLegLeft);
        tableLegLeft.receiveShadow = true;

        // model levé odrazové desky
        var tableBorderLeft = new THREE.Mesh(
            new THREE.CubeGeometry(
                planeWidth * 0.95,
                2,
                20,
                planeQuality,
                planeQuality,
                1
            ),

            tableBorderMat
        );
        tableBorderLeft.position.z = 0;
        tableBorderLeft.position.y = planeWidth * 0.255;
        scene.add(tableBorderLeft);
        tableBorderLeft.receiveShadow = true;

        // model pravé nohy stolu
        var tableLegRight = new THREE.Mesh(
            new THREE.CubeGeometry(
                20,
                20,
                100,
                planeQuality,
                planeQuality,
                1
            ),

            tableLegMat
        );
        tableLegRight.position.z = -71;
        tableLegRight.position.x = -planeHeight * 0.94;
        tableLegRight.position.y = -planeWidth * 0.23;
        scene.add(tableLegRight);
        tableLegRight.receiveShadow = true;

        // model pravé odrazové desky
        var tableBorderRight = new THREE.Mesh(
            new THREE.CubeGeometry(
                planeWidth * 0.95,
                2,
                20,
                planeQuality,
                planeQuality,
                1
            ),

            tableBorderMat
        );
        tableBorderRight.position.z = 0;
        tableBorderRight.position.y = -planeWidth * 0.255;
        scene.add(tableBorderRight);
        tableBorderRight.receiveShadow = true;

        // model hrací plochy na stole
        var plane = new THREE.Mesh(
            new THREE.PlaneGeometry(
                planeWidth * 0.95,
                planeHeight,
                planeQuality,
                planeQuality
            ),

            planeMat
        );
        scene.add(plane);
        plane.receiveShadow = true;

        // 3D objekt hracího míče
        var radius = 5,
            segments = 5,
            rings = 5

        ball = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, rings),
            sphereMaterial
        );

        scene.add(ball);
        ball.position.x = 0;
        ball.position.y = 0;
        ball.position.z = radius;
        ball.receiveShadow = true;
        ball.castShadow = true;

        // 3D objekt pálek
        paddleWidth = 8;
        paddleHeight = 32;
        paddleDepth = 15;
        paddleQuality = 2;

        // hráčova pálka
        paddlePlayer = new THREE.Mesh(
            new THREE.CubeGeometry(
                paddleWidth,
                paddleHeight,
                paddleDepth,
                paddleQuality,
                paddleQuality,
                paddleQuality
            ),

            paddlePlayerMat
        );

        scene.add(paddlePlayer);
        paddlePlayer.receiveShadow = true;
        paddlePlayer.castShadow = true;

        paddlePlayer.position.x = -planeWidth / 2 + paddleWidth - 11;
        paddlePlayer.position.z = paddleDepth;


        // AI pálka
        paddleAI = new THREE.Mesh(
            new THREE.CubeGeometry(
                paddleWidth,
                paddleHeight,
                paddleDepth,
                paddleQuality,
                paddleQuality,
                paddleQuality
            ),

            paddleAIMat
        );

        scene.add(paddleAI);
        paddleAI.receiveShadow = true;
        paddleAI.castShadow = true;

        paddleAI.position.x = planeWidth / 2 - paddleWidth - 30;
        paddleAI.position.z = paddleDepth;

        //nastavení pozice kamery
        camera.position.x = paddlePlayer.position.x - 100;
        camera.position.z = paddlePlayer.position.z + 100 + 0.04 * paddlePlayer.position.x;
        camera.rotation.y = -60 * Math.PI / 180;
        camera.rotation.z = -90 * Math.PI / 180;

        // pointlight
        pointLight = new THREE.PointLight(0xf8d898);

        pointLight.position.x = -1000;
        pointLight.position.y = 0;
        pointLight.position.z = 1000;
        pointLight.intensity = 2;
        pointLight.distance = 10000;
        scene.add(pointLight);

        // spotlight
        spotLight = new THREE.SpotLight(0xf8d898);
        spotLight.position.set(0, 0, 460);
        spotLight.intensity = 1;
        spotLight.castShadow = true;
        scene.add(spotLight);

    }

    // hlavní animační smyčka
    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);

        ballMovement();
        ballPaddleHit();
        playerPaddleMovement();
        opponentPaddleMovement();
    }

    // chování míče
    function ballMovement() {
        // skóruje hráč (míč mimo hrací plochu na straně AI)
        if (ball.position.x >= planeWidth / 2) {
            soundPointEarned();
            scorePlayer++;
            document.getElementById("scorePlayer").innerHTML = scorePlayer
            resetBall(1);
            scoreCheck();
        }
        // skóruje AI (míč mimo hrací plochu na straně hráče)
        if (ball.position.x <= -planeWidth / 2) {
            soundPointEarned();
            scoreAI++;
            document.getElementById("scoreAI").innerHTML = scoreAI
            resetBall(2);
            scoreCheck();
        }
        // chování míče v průběhu hry
        if (!end) {
            // změna směru míče při odrazu
            if (ball.position.y <= -planeHeight * 0.9 / 2) {
                ballDirY = -ballDirY;
            }
            if (ball.position.y >= planeHeight * 0.9 / 2) {
                ballDirY = -ballDirY;
            }
            // pohyb míče
            ball.position.x += ballDirX * ballSpeed;
            ball.position.y += ballDirY * ballSpeed;

            // dynamické zrychlování míče v průběhu hry až na maximální rychlost
            if (ballSpeed < maxBallSpeed) {
                ballSpeed += 0.1;
            } else {
                ballSpeed = maxBallSpeed;
            }

            // limitování příliš prudké změny rychlosti
            if (ballDirY > ballSpeed * 2) {
                ballDirY = ballSpeed * 2;
            } else if (ballDirY < -ballSpeed * 2) {
                ballDirY = -ballSpeed * 2;
            }

        }
    }

    // Chování AI pálky
    function opponentPaddleMovement() {
        // AI pálka kopíruje pohyb míče
        if (!end) {
            if (ballDirX > 0 && ball.position.x >= -planeWidth / 4) {
                paddleAIDirY = (ball.position.y - paddleAI.position.y) * difficulty;

                if (Math.abs(paddleAIDirY) <= paddleSpeed) {
                    paddleAI.position.y += paddleAIDirY;
                } else {
                    if (paddleAIDirY > paddleSpeed) {
                        paddleAI.position.y += paddleSpeed;
                    } else if (paddleAIDirY < -paddleSpeed) {
                        paddleAI.position.y -= paddleSpeed;
                    }
                }
            }
        } else {
            paddleAI.position.y = 0;
        }
    }

    // Ovládání hráčovy pálky
    function playerPaddleMovement() {
        window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
        window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);
        //kontrola, jestli není pálka na kraji hrací plochy
        if (!end) {
            // pohyb doleva
            if (Key.isDown(Key.A)) {
                if (paddlePlayer.position.y < planeHeight * 0.4) {
                    paddlePlayerDirY = paddleSpeed * 0.5;
                } else {
                    paddlePlayerDirY = 0;
                }

                // pohyb doprava
            } else if (Key.isDown(Key.D)) {
                if (paddlePlayer.position.y > -planeHeight * 0.4) {
                    paddlePlayerDirY = -paddleSpeed * 0.5;
                } else {
                    paddlePlayerDirY = 0;
                }
            } else {
                paddlePlayerDirY = 0;
            }

            paddlePlayer.scale.y += (1 - paddlePlayer.scale.y) * 0.2;
            paddlePlayer.scale.z += (1 - paddlePlayer.scale.z) * 0.2;
            paddlePlayer.position.y += paddlePlayerDirY;
        } else {
            paddlePlayer.position.y = 0;

        }
    }

    // Chování míče při odrazu od pálky
    function ballPaddleHit() {

        // hráčova pálka
        if (ball.position.x <= paddlePlayer.position.x + paddleWidth && ball.position.x >= paddlePlayer.position.x) {
            if (ball.position.y <= paddlePlayer.position.y + paddleHeight / 2 && ball.position.y >= paddlePlayer.position.y - paddleHeight / 2) {
                if (ballDirX < 0) {
                    // při nárazu se změní směr míčku
                    ballDirX = -ballDirX;
                    // úhel, pod kterým je míček trefen také ovlivňuje jeho následný směr
                    ballDirY -= paddlePlayerDirY * Math.sin(ballDirY / ballDirX);
                    soundHit();
                }
            }
        }

        // AI pálka
        if (
            ball.position.x <= paddleAI.position.x + paddleWidth &&
            ball.position.x >= paddleAI.position.x
        ) {
            if (
                ball.position.y <= paddleAI.position.y + paddleHeight / 2 &&
                ball.position.y >= paddleAI.position.y - paddleHeight / 2
            ) {
                if (ballDirX > 0) {
                    ballDirX = -ballDirX;
                    ballDirY -= paddleAIDirY * Math.sin(ballDirY / ballDirX);
                    soundHit();
                }
            }
        }
    }

    function resetBall(loser) {
        ball.position.x = 0;
        ball.position.y = 0;
        // míč jde v dalším kole vždy k vítězi minulého kola
        if (loser == 1) {
            ballDirX = -1;
        } else {
            ballDirX = 1;
        }
        // náhodné určení, kterým směrem po restartu půjde míč k hráči
        ballDirY = (Math.random() - 0.5) * 2;
        ballSpeed = 0.5;
    }

    // kontrola konce hry
    function scoreCheck() {
        // vyhrál hráč
        if (scorePlayer >= maxScore) {
            ballSpeed = 0;
            end = true;
            soundVictory();
            document.getElementById("alert").innerHTML = "Player wins!";
            document.getElementById("buttonWrapper").style.display = "block";
            document.getElementById('button').addEventListener('click', function(e) {
                restartGame()
            });
            // vyhrál AI
        } else if (scoreAI >= maxScore) {
            ballSpeed = 0;
            end = true;
            soundDefeat();
            document.getElementById("alert").innerHTML = "AI wins!";
            document.getElementById("buttonWrapper").style.display = "block";
            document.getElementById('button').addEventListener('click', function(e) {
                restartGame()
            });
        }
    }

    function soundHit() {
        var sound = new Audio("sounds/hit.wav");
        sound.play();
    }

    function soundPointEarned() {
        var sound = new Audio("sounds/point_earned.wav");
        sound.play();
    }

    function soundVictory() {
        var sound = new Audio("sounds/victory.wav");
        sound.play();
    }

    function soundDefeat() {
        var sound = new Audio("sounds/defeat.wav");
        sound.play();
    }


}