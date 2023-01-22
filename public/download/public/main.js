const version = '1.0.0';

const can = document.querySelector('#game');
const canDirty = document.querySelector('#dirty-game');
const canUi = document.querySelector('#game-ui');
const clickHandler = document.querySelector('#click-handler');
const info = document.querySelector('#info');
const playerNick = document.getElementById('nick-name');
const startGameBtn = document.querySelector('#start-game');
const startMenu = document.querySelector('#menu');
const gameWindow = document.querySelector('#game-window');
const serverStatusInfo = document.querySelector('#server-status-info');
const ctx = can.getContext('2d');
const ctxUi = canUi.getContext('2d');
const dirtyCtx = canDirty.getContext('2d');

let originX = 0;
let originY = 0;
let cursorMode = 'none';

let showInvetory = false;
let showCrafting = false;

startGameBtn.addEventListener('click', () => {
    startGame();
});

//Mobile
const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let mobileShootingCursor = false;
//Mobile END

class Hitbox {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

const camera = {
    x: 0,
    y: 0,
    hitbox: new Hitbox(0, 0, 1216, 800)
};

let state = 'waitForNick';

let ping = 0;

let myPlayer;
let gamePlayers = [];
let blocksStats;
let gameBullets = [];
let gameChests = [];
let gameEnemies = [];
let gameMap = [];
let gameBlocks = [];
let gameChunks = [];

let gameState;

class Button {
    constructor(x, y, width, height, event, active, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.event = event;
        this.active = active;
        this.image = image;
        this.hitbox;
    }

    draw() {
        const {
            image,
            x,
            y,
            active
        } = this;
        if (active) {
            ctx.drawImage(image, x, y);
        }
    }
}

//IMAGES
//Ui
const openUiBtnImage = new Image();
const changeWeaponUiBtnImage = new Image();
const shootUiBtnImage = new Image();
const solidObjectsSpritesheet = new Image();
const backgroundSpritesheet = new Image();
const invetoryImage = new Image();
const hpBarFullImage = new Image();
const hpBarEmptyImage = new Image();
const hpBarNearlyFullImage = new Image();
openUiBtnImage.src = 'img/ui/open3.png';
changeWeaponUiBtnImage.src = 'img/ui/change-weapon.png';
shootUiBtnImage.src = 'img/ui/shoot.png';
solidObjectsSpritesheet.src = 'img/world/solidObjectsTile.png';
backgroundSpritesheet.src = 'img/world/backgroundTiled01.png';
invetoryImage.src = 'img/ui/invetory/invetory.png';
hpBarFullImage.src = 'img/ui/hp-bar/full2.png';
hpBarNearlyFullImage.src = 'img/ui/hp-bar/3.4.png';
hpBarEmptyImage.src = 'img/ui/hp-bar/1.4.png';
//Ui End

//World
const grassSpritesheet = new Image();
grassSpritesheet.src = 'img/world/grass.png';
//World End
//END - IMAGES

const uiButtons = {
    open: new Button(575, 650, 50, 50, 'open-chest', false, openUiBtnImage),
    changeWeapon: new Button(50, 650, 100, 100, 'change-weapon', true, changeWeaponUiBtnImage),
    shoot: new Button(50, 500, 100, 100, 'shoot', mobile, shootUiBtnImage)
};

const log = document.getElementById('log');

function startGame() {
    const mode = document.getElementById('player-mode').value;
    console.log(mode);
    if (playerNick.value !== '') {
        let state;
        if (mode === 'player') {
            state = 'yesPlay';
        } else if (mode === 'spectator') {
            state = 'spectator';
        }

        const host = 'localhost';

        const socket = io(); //Connect => connected
                
        const object = {
            state: state,
            name: playerNick.value
        };
        
        socket.emit('enter-to-game', object); //Server check version (true) => :145 or(false) => :149

        socket.once('assign-player', data => {
            myPlayer = data;
        });
        
        clickHandler.addEventListener('click', (e) => {
            const {
                invetory
            } = myPlayer;
            console.warn(invetory);
            if (showInvetory) {
                socket.emit('move-item-in-invetory', {
                    x: mouseX,
                    y: mouseY
                });
            }
        });
        
        socket.on('get-version', (callback) => {
            /*callback({
                version: version
            });*/
        });
        
        socket.on('delete-connection', data => {
            socket = null;
            alert('Your client version is no good');
        });

        socket.on('send-alert', data => {
            alert(data);
        });

        socket.on('send-blocks-stats', data => {
            blocksStats = data;
        });

        socket.on('change-cursor-state', data => {
            cursorMode = data;
            console.error(cursorMode);
            if (cursorMode === 'marking') {
                clickHandler.style.cursor = 'crosshair';
            } else if (cursorMode === 'direction') {

                clickHandler.style.cursor = 'pointer';
            } else {
                clickHandler.style.cursor = 'auto';
                cursorMode = 'moving';
            }
        });

        socket.on('send-status-server', data => {
            if (data.state === 'connected') {
                serverStatusInfo.innerHTML = 'Server status: Connected';
                socket.emit('client-version', version);
                serverStatusInfo.innerHTML += 'Server status: Connected Checking Version';
            } else {
                serverStatusInfo.innerHTML = data;
            }
        });

        socket.on('send-info', data => {
            info.innerHTML = data;
        });

        socket.on('send-players', data => {
            gamePlayers = data;
            for (const player of gamePlayers) {
                if (socket.id === player.id) {
                    if (JSON.stringify(myPlayer) !== JSON.stringify(player)) {
                        myPlayer = player;
                        updateUi();
                        socket.emit('update-object');
                    }
                } else {
                    console.log(player.movingSpeed);
                }
            }
        });

        socket.on('send-bullets', data => {
            gameBullets = data;
        });

        socket.on('send-chests', data => {
            gameChests = data;
        });

        socket.on('send-enemies', data => {
            gameEnemies = data;
        });

        socket.on('send-map', data => {
            gameMap = data;
        });

        socket.on('send-blocks', data => {
            gameBlocks = data;
        });

        socket.on('send-game-state', data => {
            gameState = data;
        });

        socket.on('send-chunks', data => {
            gameChunks = data;
        });
        
        
        //EVENTS-------------------------------------------------------------------------------------------------------------------------------
        
        document.addEventListener('keyup', e => {
            if (e.keyCode === 32) {
                e.preventDefault();
                socket.emit('player-open-chest');
            } else if (e.keyCode === 86) {
                socket.emit('player-change-weapon');
            } else if (e.keyCode === 69) {
                socket.emit('request-cursor-mode', cursorMode);
            } else if (e.keyCode === 84) {
                socket.emit('player-change-spell');
            }
        });

        clickHandler.addEventListener('click', e => {

            //fconsole.warn(checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.open.x, uiButtons.open.y, uiButtons.open.width, uiButtons.open.height)));
            if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.open.x, uiButtons.open.y, uiButtons.open.width, uiButtons.open.height))) {
                console.log('SSSSS');

                socket.emit('player-open-chest');
            } else if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.changeWeapon.x, uiButtons.changeWeapon.y, uiButtons.changeWeapon.width, uiButtons.changeWeapon.height))) {
                socket.emit('player-change-weapon');
            } else if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.shoot.x, uiButtons.shoot.y, uiButtons.shoot.width, uiButtons.shoot.height))) {
                mobileShootingCursor = !mobileShootingCursor;
            } else if (!mobileShootingCursor) {
                
            } else if (mobileShootingCursor) {
                const object = {
                    x: e.offsetX,
                    y: e.offsetY
                };
                console.log(object);
                socket.emit('player-attack', object);
            }

            if (cursorMode === 'marking') {
                let counter = 0;
                let uses = false;
                const targetX = (e.offsetX - 700) + myPlayer.x;
                const targetY = (e.offsetY - 460) + myPlayer.y;
                const cursorHitbox = new Hitbox(targetX, targetY, 5, 5);

                console.error('DWAAAAAAAA', cursorHitbox, myPlayer.x, myPlayer.y);
                socket.emit('spell-marking', cursorHitbox);

               
            } else if (cursorMode === 'direction') {
               
            }

        });


        document.addEventListener('mousedown', (e) => {
            socket.emit('player-mouse-down', e.which);
        });

        window.oncontextmenu = function () {
            return false;
        }

        document.addEventListener('mouseup', (e) => {
            socket.emit('player-mouse-up', e.which);
        });

        document.addEventListener('keydown', (e) => {
            socket.emit('player-start-move', e.keyCode);
        });

        document.addEventListener('keyup', (e) => {
            if (e.keyCode === 73) {
                showInvetory = !showInvetory;
                updateUi();
            } else if (e.keyCode === 52) {
                showCrafting = !showCrafting;
                updateUi();
            }
        });

        document.addEventListener('keyup', (e) => {
            socket.emit('player-stop-move', e.keyCode);
        });

        setInterval(() => {
            const start = Date.now();

            socket.emit('ping', () => {
                const duration = Date.now() - start;

                ping = duration + 'ms';
            });
        }, 1000);

        clickHandler.addEventListener('contextmenu', e => {
            e.preventDefault();
            console.log(e);
            const object = {
                x: e.offsetX,
                y: e.offsetY
            };
            console.log(object);
            socket.emit('player-attack', object);
            console.log('playerattack');
        });



        gameWindow.style.display = 'grid';
        //        can.style.display = 'block';
        canUi.style.display = 'block';
        canDirty.style.display = 'block';
        clickHandler.style.display = 'block';
        startMenu.style.display = 'none';
        // gameWindow.requestFullscreen(({ navigationUI: 'show' }));
        if (mobile) {
            let width = /*Math.min(1200, window.innerWidth);*/ 1200;
            let height = /*Math.min(800, window.innerHeight);*/ 800;
        }
    }
}


let mouseX;
let mouseY;

clickHandler.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});

ctx.font = '20px Monospace';
ctxUi.font = '20px Monospace';

function drawAll() {
    ctx.clearRect(0, 0, 5000, 5000);
    drawMap(gameMap);
    drawBlocks(gameBlocks);
    drawPlayers(gamePlayers);
    drawEnemies(gameEnemies);
    drawChests(gameChests);
    drawBullets(gameBullets);
    if (myPlayer !== undefined) {
        drawInvetory(myPlayer.invetory, null, ctxUi, 'full-view', canUi, invetoryImage);
    }
    uiButtons.changeWeapon.draw();
    uiButtons.open.draw();
    uiButtons.shoot.draw();
    setCamera();
    //if (gameState === 'play' ) console.log(myPlayer.x, myPlayer.y);
    requestAnimationFrame(drawAll);
}



function setCamera() {
    if (gameState === 'play') {
        dirtyCtx.clearRect(0, 0, canDirty.width, canDirty.height);
        dirtyCtx.drawImage(can, myPlayer.x - 700, myPlayer.y - 460, canDirty.width, canDirty.height, 0, 0, 1400, 920);
    }
}

function drawBullets(gameBullets) {
    if (gameBullets.length !== 0) {
        for (const bullet of gameBullets) {
            if (bullet.icon === myPlayer.id) {
                ctx.fillStyle = '#32a852';
            } else {
                ctx.fillStyle = '#b84f28';
            }
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
}


function drawMap(gameMap) {
    /*if (gameMap.length !== 0) {
        for (let width = 0; width < 5; width++) {
            for (let height = 0; height < 5; height++) {
                const chunk = gameMap.chunks[width][height];
                for (const block of chunk.content) {
                    const {x, y, width, height, type} = block;
                    
                    ctx.drawImage(backgroundSpritesheet, 64 * type, 0, 64, 64, x, y, width, height);
//            ctx.strokeRect(x, y, width, height);
            }
                //ctx.strokeRect(gameMap.chunks[width][height].x, gameMap.chunks[width][height].y, gameMap.chunks[width][height].width, gameMap.chunks[width][height].height);
            }
        }
    }*/


    if (gameChunks.length !== 0) {
        for (let width = 0; width < 3; width++) {
            for (let height = 0; height < 3; height++) {
                const chunk = gameChunks[width][height];
                console.log(gameChunks);
                /*for (const block of chunk.content) {
                    const {x, y, width, height, type} = block;
                    
                    ctx.drawImage(backgroundSpritesheet, 64 * type, 0, 64, 64, x, y, width, height);
//            ctx.strokeRect(x, y, width, height);
            }*/
                //ctx.strokeRect(gameMap.chunks[width][height].x, gameMap.chunks[width][height].y, gameMap.chunks[width][height].width, gameMap.chunks[width][height].height);
            }
        }
    }
}

function drawChests(gameChests) {
    if (gameChests.length !== 0) {
        for (const chest of gameChests) {
            if (chest.icon === 'item') {
                ctx.fillStyle = '#239db0';
            } else if (chest.icon === 'chest') {
                ctx.fillStyle = '#b0531e';
            }

            if (!chest.isOpen) {
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
            }
        }
    }
}

function checkCollisionWith(hitbox1, hitbox2) {
    if (hitbox1.x < hitbox2.x + hitbox2.width &&
        hitbox1.x + hitbox1.width > hitbox2.x &&
        hitbox1.y < hitbox2.y + hitbox2.height &&
        hitbox1.height + hitbox1.y > hitbox2.y) {

        return true;

    } else {
        return false;
    }
}

function drawInvetory(invetory, ctx, functionDrawText, mode, can, graphics) {
    console.log(invetory);
    const {
        basicSlots,
        numberOfBasicSlots,
    } = invetory;
    //console.log(graphics);

    if (showInvetory && mode === 'quick-preview') {
        functionDrawText(1080, 40, basicSlots, 'black', 20, 'Monospace', numberOfBasicSlots, 'Invetory/content');
    } else if (showInvetory && mode === 'full-view') {
        const generalY = (950 - 698) / 2;
        const generalX = (1500 - 854) / 2;
        ctxUi.drawImage(graphics, generalX, generalY);


        for (let i = 0; i < numberOfBasicSlots; i++) {
            const dSlot = basicSlots[i];
            console.log(dSlot);
            if (dSlot.content !== 'empty') {
                if (dSlot.content.itemName === 'Test01') {
                    ctxUi.fillStyle = 'green';
                } else {
                    ctxUi.fillStyle = 'white';
                }
                ctxUi.fillStyle = 'black';
                ctxUi.fillText(dSlot.content.itemName, generalX + dSlot.x, generalY + dSlot.y);
                ctxUi.fillText(dSlot.amount, generalX + dSlot.x, generalY + dSlot.y - 20);
                ctxUi.fillStyle = 'white';
                ctxUi.fillRect(generalX + dSlot.x, generalY + dSlot.y, 85, 85);
            }
        }
    }

    if (showInvetory) {
        for (const slot of myPlayer.invetory.basicSlots) {
            const slotHitbox = new Hitbox(323 + slot.x, 126 + slot.y, 85, 85);
            const cursor = new Hitbox(mouseX, mouseY, 1, 1);
            const collisionWith = checkCollisionWith(cursor, slotHitbox);

            if (collisionWith) {
                console.log(slot);
                ctxUi.fillStyle = 'black';
                if (slot.content !== 'empty') {
                    //                drawText(323 + 55, 126 + 490 + 20, slot.content.itemName, 'black', 20);
                    ctxUi.fillText(slot.content.itemName, 323 + slot.x, 126 + slot.y + 20);
                    ctxUi.fillText(slot.amount, 323 + slot.x, 126 + slot.y + 20 + 20);
                } else {
                    //                drawText(323 + slot.x, 126 + slot.y + 20, slot.content, 'black', 20);
                    ctxUi.fillText(slot.content, 323 + slot.x, 126 + slot.y + 20);
                }
            }
        }
    }
    
    if (showCrafting) {
        for (const recipe of myPlayer.recipes) {
            let counter = 780;
            console.log(recipe);
            for (const ingredient of recipe.ingredients) {
                ctxUi.fillText(ingredient.item.itemName+'/'+ingredient.amount, 780, counter);
                counter += 30;
            }
//            ctxUi.fillText(recipe.products[], 323 + slot.x, 126 + slot.y + 20);
            /*const slotHitbox = new Hitbox(323 + slot.x, 126 + slot.y, 85, 85);
            const cursor = new Hitbox(mouseX, mouseY, 1, 1);
            const collisionWith = checkCollisionWith(cursor, slotHitbox);

            if (collisionWith) {
                console.log(slot);
                ctxUi.fillStyle = 'black';
                if (slot.content !== 'empty') {
                    //                drawText(323 + 55, 126 + 490 + 20, slot.content.itemName, 'black', 20);
                    ctxUi.fillText(slot.content.itemName, 323 + slot.x, 126 + slot.y + 20);
                    ctxUi.fillText(slot.amount, 323 + slot.x, 126 + slot.y + 20 + 20);
                } else {
                    //                drawText(323 + slot.x, 126 + slot.y + 20, slot.content, 'black', 20);
                    ctxUi.fillText(slot.content, 323 + slot.x, 126 + slot.y + 20);
                }
            }*/
        }
    }


}

function drawPlayers(gamePlayers) {
    if (gamePlayers.length !== 0) {
        for (const player of gamePlayers) {
            if (player.id === myPlayer.id) {
                ctx.fillStyle = 'green';
                ctx.fillText('You', player.x, player.y - 8);
            } else {
                const hpPercent = convertNumberToPercent(player.hp, player.maxHp);
                const hpBarWidth = player.width * hpPercent / 100;
                ctx.fillStyle = '#4A2323';
                ctx.fillRect(player.x, player.y - 12, player.width, 8);
                if (player.hp > 0) {
                    ctx.fillStyle = '#f74d4d';
                    ctx.fillRect(player.x, player.y - 12, hpBarWidth, 8);
                }
                ctx.lineWidth = '3px';
                ctx.strokeRect(player.x, player.y - 12, player.width, 8);
                ctx.fillStyle = 'red';
                ctx.fillText(player.name, player.x, player.y - 16);
                console.log(player.name, player.id);
            }
            ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.fillStyle = 'black';

            if (!player.isAlive) {
                ctx.fillStyle = 'black';
                ctx.fillText('DIE', player.x, player.y + 16);
            }
        }
    }
}

function drawEnemies(gameEnemies) {
    if (gameEnemies.length !== 0) {
        for (const enemy of gameEnemies) {
            const {
                x,
                y,
                width,
                height,
                hp,
                maxHp
            } = enemy;
            if (enemy.isAlive) {
                ctx.fillStyle = 'brown';
                ctx.fillRect(x, y, width, height);

                const hpPercent = convertNumberToPercent(hp, maxHp);
                const hpWidth = enemy.width * hpPercent / 100;

                console.log(hpWidth);
                ctx.fillStyle = '#4A2323';
                ctx.fillRect(x, y - 10, width, 8);
                ctx.fillStyle = '#f74d4d';
                ctx.fillRect(x, y - 10, hpWidth, 8);
                ctx.fillStyle = 'black';
                ctx.lineWidth = '0.3px';
                ctx.strokeRect(x, y - 10, width, 8);
                ctx.font = 'Monospace 10px';
                //                ctx.fillText(enemy.ammunition[0].allAmmunition, x, y - 20);
                ctx.fillText(enemy.ammunition[0].actualAmmunition + ',' + enemy.ammunition[0].allAmmunition, x, y - 20);
            }
        }
    }
}

function drawBlocks(gameBlocks) {
    if (gameBlocks.length !== 0) {
        for (const block of gameBlocks) {
            const {
                x,
                y,
                width,
                height,
                type
            } = block;
            ctx.drawImage(solidObjectsSpritesheet, 64 * type, 0, 64, 64, x, y, width, height);
        }
    }
}

function updateUi() {
    ctxUi.fillText('Shooting:' + mobileShootingCursor, 50, 480);
    for (const chest of gameChests) {
        if (checkCollisionWith(myPlayer.hitbox, chest.hitbox)) {
            uiButtons.open.active = true;
            uiButtons.open.x = 100;
            uiButtons.open.y = 550;
//            console.warn(uiButtons.open.x, uiButtons.open.y);
        } else {
            uiButtons.open.active = false;
        }
    }
    const hpPercent = convertNumberToPercent(myPlayer.hp, myPlayer.maxHp);
    const magicEnergyPercent = convertNumberToPercent(myPlayer.magicEnergy, myPlayer.maxMagicEnergy);
    //const actualSpellOfMagicEnergyPercent = convertNumberToPercent(actualPlayerSpell.requiredMagicEnergy, player1.maxMagicEnergy);
    const width = 300;
    const hpPercentWidth = width * hpPercent / 100;
    const magicEnergyPercentWidth = width * magicEnergyPercent / 100;
    //const actualSpellOfMagicEnergyPercentWidth = width * actualSpellOfMagicEnergyPercent / 100;
    //const to = 15 + magicEnergyPercentWidth;
    //const from = to - actualSpellOfMagicEnergyPercentWidth;
    //playerHpWidthCounter = hpPercentWidth;
    /*if (oldplayerHpWidthCounter >= playerHpWidthCounter && !healthingPlayer) {
        oldplayerHpWidthCounter -= 1.4;
    } else if (oldplayerHpWidthCounter <= playerHpWidthCounter && healthingPlayer) {
        oldplayerHpWidthCounter += 1.2;
    }*/



    ctxUi.clearRect(0, 0, 1400, 920);
    /*ctxUi.fillText(myPlayer.block, 80, 180);
    ctxUi.fillStyle = '#4A2323';
    ctxUi.fillRect(15, 5, width, 20);
    ctxUi.fillStyle = '#f74d4d';
    if (myPlayer.hp > 0) {
        ctxUi.fillRect(15, 5, hpPercentWidth, 20);
    }*/
    ctxUi.fillText('Aktualne zaklęcie:' + myPlayer.actualSpell, 120, 550);

    //HP - Bar
    if (hpPercent > 85) {
        ctxUi.drawImage(hpBarFullImage, 15, 5);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/' + myPlayer.maxHp, 15 + 158, 5 + 35);
    } else if (hpPercent > 35) {
        ctxUi.drawImage(hpBarNearlyFullImage, 15, 5);
        ctxUi.fillStyle = 'blue';
        ctxUi.fillRect(15, 5, hpPercentWidth, 8);

        ctxUi.clearRect(15 + 254, 5 + 28, (width - hpPercentWidth) * -1 + 50, 22);

        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/' + myPlayer.maxHp, 15 + 158, 5 + 35);

    } else {
        ctxUi.drawImage(hpBarEmptyImage, 15, 5);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/' + myPlayer.maxHp, 15 + 158, 5 + 35);
    }
    //END HP - Bar

    //MANA - Bar
    if (magicEnergyPercent > 85) {
        ctxUi.drawImage(hpBarFullImage, 15, 90);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/' + myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);
    } else if (magicEnergyPercent > 35) {
        ctxUi.drawImage(hpBarNearlyFullImage, 15, 90);
        ctxUi.fillStyle = 'blue';
        //        ctxUi.fillRect(15, 5, magicEnergyPercentWidth, 8);

        ctxUi.clearRect(15 + 254, 90 + 28, (width - magicEnergyPercentWidth) * -1 + 90, 22);

        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/' + myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);

    } else {
        ctxUi.drawImage(hpBarEmptyImage, 15, 90);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/' + myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);
    }
    //END MANA - Bar

    //    ctxUi.clearRect(268, 32, hpPercentWidth, 22);
    ctxUi.fillStyle = 'green';
    ctxUi.fillRect(15, 5, hpPercentWidth, 8);


    if (myPlayer.spellsBuffer.reloadsTimes[0] !== undefined) {
        //        const loadProcess = 100 - convertNumberToPercent(myPlayer.spellsBuffer.reloadsTimes[0], myPlayer.actualSpell.reload[0] * 1000);
        //        const drawingProcess = 65 * loadProcess / 100;

        //        ctxUi.fillRect(850, 120, drawingProcess, 65);
        ctxUi.fillStyle = 'red';
        ctxUi.fillText(myPlayer.spellsBuffer.reloadsTimes[0], 125, 570);
    }

    //    ctxUi.fillStyle = 'red';
    //    ctxUi.fillRect(15, 0, -35, 8);

    const {
        name,
        type
    } = myPlayer.weapon;
    const {
        actualAmmunition,
        maxMagazine,
        reloading,
        allAmmunition
    } = myPlayer.ammunition[0];

    ctxUi.font = '20px Monospace';
    ctxUi.fillStyle = 'black';
    /*ctxUi.fillText('You:' + myPlayer.name, 15, 45);
    ctxUi.fillText('Weapon:'+name, 15, 95);
    ctxUi.fillText('Type:'+type, 15, 115);*/
    ctxUi.fillText(blocksStats, 15, 25);
    if (type === 'distance') {
        console.log(myPlayer.ammunition[0]);
        console.log(myPlayer.ammunition[0].actualAmmunition);
        ctxUi.fillText(actualAmmunition + '/' + maxMagazine + ',' + reloading + ',' + allAmmunition, 15, 150)
    }

    /*if (hpPercent >= 0) {
        ctx.fillRect(15, 5, magicEnergyPercentWidth, 20);    
    }
    ctx.fillStyle = '#152C55';
    ctx.fillRect(15, 30, width, 20);
    ctx.fillStyle = '#1F5FD1';
    if (magicEnergyPercent >= 0) {
        ctx.fillRect(15, 30, magicEnergyPercentWidth, 20);    
    }
    if (actualPlayerSpell.requiredMagicEnergy <= player1.magicEnergy) {
        ctx.fillStyle = '#F3E50A';   
        ctx.fillRect(from, 30, actualSpellOfMagicEnergyPercentWidth, 20);    
    } else {
        ctx.fillStyle = '#E7620B';
        ctx.fillRect(15, 30, actualSpellOfMagicEnergyPercentWidth, 20);  
        ctx.fillStyle = '#F3E50A';   
        ctx.fillRect(15, 30, magicEnergyPercentWidth, 20);    
    }*/
}

function convertNumberToPercent(part, all) {
    return (part / all) * 100;
}

requestAnimationFrame(drawAll);