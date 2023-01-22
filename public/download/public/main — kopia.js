/*const socket = io('http://192.168.0.9:3000', {
    transports: ['websocket']
});*/
const host = 'localhost';
//const host = '192.168.0.9';

const socket = io('http://'+host+':3000', {
    transports: ['websocket']
});

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

startGameBtn.addEventListener('click',()=>{
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
    x : 0,
    y : 0,
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
        const {image, x, y, active} = this;
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

function startGame () {
    const mode = document.getElementById('player-mode').value;
    console.log(mode);
    if (playerNick.value !== '') {
        if (mode === 'player') {
            myPlayer.state = 'yesPlay';    
        } else if (mode === 'spectator') {
            myPlayer.state = 'spectator';        
        }
        
        const object = {
            state: myPlayer.state,
            name: playerNick.value
        };
        socket.emit('enter-to-game', object);
        gameWindow.style.display = 'grid';
//        can.style.display = 'block';
        canUi.style.display = 'block';
        canDirty.style.display = 'block';
        clickHandler.style.display = 'block';
        startMenu.style.display = 'none';
       // gameWindow.requestFullscreen(({ navigationUI: 'show' }));
        if (mobile) {
            let width = /*Math.min(1200, window.innerWidth);*/1200;
            let height = /*Math.min(800, window.innerHeight);*/800;
            /*can.width = width;
            canUi.width = width;
            clickHandler.width = width;
            can.height = height;
            canUi.height = height;
            clickHandler.height = height;
            
            can.style.height = window.innerHeight+'px';
            canUi.style.height = window.innerHeight+'px';
            clickHandler.style.height = window.innerHeight+'px';*/
            
            /*can.style.width = window.innerWidth+'px';
            canUi.style.width = window.innerWidth+'px';
            clickHandler.style.width = window.innerWidth+'px';*/
            
//            gameWindow.height = innerHeight;
            //gameWindow.requestFullscreen();
        }
    }
}

document.addEventListener('keyup', e => {
    if (e.keyCode === 32) {
        e.preventDefault();
        socket.emit('player-open-chest');
    } else if (e.keyCode === 86) {
        socket.emit('player-change-weapon');
    } else if (e.keyCode === 69) {
//        bewitch(cursorMode ,thrower, typeOfThrower, spellsBuffer) {
        socket.emit('request-cursor-mode', cursorMode);
//        cursorMode = actualPlayerSpell.bewitch(cursorMode, player1, 'player', playerSpellsBuffer);
        /*if (cursorMode === 'marking') {
            canUi.style.cursor = 'crosshair';
        } else if (cursorMode === 'direction') {
            canUi.style.cursor = 'pointer';
        } else {
            canUi.style.cursor = 'auto';
            cursorMode = 'moving';
        }
        if (cursorMode === 'marking') {
            
        }*/
    } else if (e.keyCode === 84) {
        socket.emit('player-change-spell');
    }
});

clickHandler.addEventListener('click', e => {

    console.warn(checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.open.x, uiButtons.open.y, uiButtons.open.width, uiButtons.open.height)));
    if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.open.x, uiButtons.open.y, uiButtons.open.width, uiButtons.open.height))) {
        console.log('SSSSS');

        socket.emit('player-open-chest');
    } else if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.changeWeapon.x, uiButtons.changeWeapon.y, uiButtons.changeWeapon.width, uiButtons.changeWeapon.height))) {
        socket.emit('player-change-weapon');
    } else if (checkCollisionWith(new Hitbox(e.offsetX, e.offsetY, 4, 4), new Hitbox(uiButtons.shoot.x, uiButtons.shoot.y, uiButtons.shoot.width, uiButtons.shoot.height))) {
        mobileShootingCursor = !mobileShootingCursor;
    } else if (!mobileShootingCursor) {
        /* socket.emit('moving-player', {
             x: e.offsetX,
             y: e.offsetY,
         });*/

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
        
        /*for (const enemy of enemies) {
            const collisionWith = checkCollisionWith(cursorHitbox, enemy.hitbox);
            if (collisionWith) {
                can.style.cursor = 'auto';
                if (!uses) {
                    player1.magicEnergy -= actualPlayerSpell.requiredMagicEnergy;
                    if (actualPlayerSpell.action === 'thunderboltAttack') {
                        actualPlayerSpell.completeSpell(enemy);
                    } else if (actualPlayerSpell.action === 'oblivion') {
                        const oldAiState = enemy.aiState;
                        const oldSecondAiState = enemy.secondAiState;

                        enemy.aiState = 'oblivion';
                        enemy.secondAiState = 'oblivion';

                        setTimeout(() => {
                            console.log(enemy.aiState)
                        }, 100);

                        setTimeout(() => {
                            enemy.aiState = oldAiState;
                            enemy.secondAiState = oldSecondAiState;
                        }, actualPlayerSpell.time * 1000);
                    }
                    cursorMode = 'moving';
                    counter++;
                }
            }
            if (Number(actualPlayerSpell.availablesObjects.substr(6)) <= counter) {
                uses = true;
                playerSpellsBuffer.spells.push(actualPlayerSpell.name);
                playerSpellsBuffer.reloadsTimes.push(actualPlayerSpell.reload * 1000);
            }
        }*/
    } else if (cursorMode === 'direction') {
        /*const {
            x,
            y
        } = player1;
        const {
            action,
            minDmg,
            maxDmg
        } = actualPlayerSpell;
        const {
            offsetX,
            offsetY
        } = e;
        let bulletWidth, bulletHeight;
        if (action === 'ballOfFire') {
            bulletWidth = 50;
            bulletHeight = 50;
        } else if (action === 'magicTrap') {
            bulletHeight = 25;
            bulletWidth = 25;
        }*/
        /*player1.magicEnergy -= actualPlayerSpell.requiredMagicEnergy;
        playerSpellsBuffer.spells.push(actualPlayerSpell.name);
        playerSpellsBuffer.reloadsTimes.push(actualPlayerSpell.reload * 1000);

        bullets.push(new Bullet(x, y, bulletWidth, bulletHeight, new Hitbox(x, y, bulletWidth, bulletHeight), 2, minDmg, maxDmg, offsetX, offsetY, 'player', 560));
        if (action === 'magicTrap') {
            bullets[bullets.length - 1].getMove = false;
            bullets[bullets.length - 1].distance = 1;
        }

        for (const bullet of bullets) {
            if (bullet.owner === 'player') {
                bullet.checkTheDirection(player1);
            }
        }
        cursorMode = 'moving';
        can.style.cursor = 'auto';*/
    }

//    console.log(mobileShootingCursor);
});

let mouseX;
let mouseY;

clickHandler.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
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

document.addEventListener('keydown', (e)=>{
    socket.emit('player-start-move', e.keyCode);
}); 

document.addEventListener('keyup', (e)=>{
    if (e.keyCode === 73) {
        showInvetory = !showInvetory;
        updateUi();
    }
}); 

document.addEventListener('keyup', (e)=>{
    socket.emit('player-stop-move', e.keyCode);
}); 

setInterval(() => {
    const start = Date.now();

    socket.emit('ping', () => {
        const duration = Date.now() - start;
        
        ping = duration + 'ms';
//        .clearRect(15, 65, 100, 20);
//        ctxUi.fillText('Ping:'+ping, 15, 65);
    });
}, 1000);

clickHandler.addEventListener('contextmenu', e => {
    e.preventDefault();
    console.log(e);
    const object = {
        x : e.offsetX,
        y : e.offsetY
    };
    console.log(object);
    socket.emit('player-attack', object);
    console.log('playerattack');
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
                } else {
                    //                drawText(323 + slot.x, 126 + slot.y + 20, slot.content, 'black', 20);
                    ctxUi.fillText(slot.content, 323 + slot.x, 126 + slot.y + 20);
                }
            }
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
            const {x, y, width, height, hp, maxHp} = enemy;
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
            const {x, y, width, height, type} = block;
            ctx.drawImage(solidObjectsSpritesheet, 64 * type, 0, 64, 64, x, y, width, height);
        }
    }
}

function updateUi() {
    ctxUi.fillText('Shooting:'+mobileShootingCursor,50, 480);
    for (const chest of gameChests) {
        if (checkCollisionWith(myPlayer.hitbox, chest.hitbox)) {
            uiButtons.open.active = true;
            uiButtons.open.x = 100;
            uiButtons.open.y = 550;
            console.warn(uiButtons.open.x, uiButtons.open.y);
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
    ctxUi.fillText('Aktualne zaklęcie:'+myPlayer.actualSpell,120, 550);
    
    //HP - Bar
    if (hpPercent > 85) {
        ctxUi.drawImage(hpBarFullImage, 15, 5);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/'+ myPlayer.maxHp, 15 + 158, 5 + 35);
    } else if (hpPercent > 35) {
        ctxUi.drawImage(hpBarNearlyFullImage, 15, 5);
        ctxUi.fillStyle = 'blue';
        console.warn(hpPercentWidth);
        ctxUi.fillRect(15, 5, hpPercentWidth, 8);
        
        ctxUi.clearRect(15 + 254, 5+28 ,(width - hpPercentWidth) * -1 + 50, 22);
        
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/'+ myPlayer.maxHp, 15 + 158, 5 + 35);
        
    } else {
        ctxUi.drawImage(hpBarEmptyImage, 15, 5);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.hp + '/'+ myPlayer.maxHp, 15 + 158, 5 + 35);
    }
    //END HP - Bar
    
    //MANA - Bar
    if (magicEnergyPercent > 85) {
        ctxUi.drawImage(hpBarFullImage, 15, 90);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/'+ myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);
    } else if (magicEnergyPercent > 35) {
        ctxUi.drawImage(hpBarNearlyFullImage, 15, 90);
        ctxUi.fillStyle = 'blue';
        console.warn(magicEnergyPercentWidth);
//        ctxUi.fillRect(15, 5, magicEnergyPercentWidth, 8);
        
        ctxUi.clearRect(15 + 254, 90+28 ,(width - magicEnergyPercentWidth) * -1 +90, 22);
        
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/'+ myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);
        
    } else {
        ctxUi.drawImage(hpBarEmptyImage, 15, 90);
        ctxUi.fillStyle = 'black';
        ctxUi.fillText(myPlayer.magicEnergy + '/'+ myPlayer.maxMagicEnergy, 15 + 158, 90 + 35);
    }
    //END MANA - Bar
    
//    ctxUi.clearRect(268, 32, hpPercentWidth, 22);
    ctxUi.fillStyle = 'green';
    console.warn(hpPercent);
    ctxUi.fillRect(15, 5, hpPercentWidth, 8);
    
    
    if (myPlayer.spellsBuffer.reloadsTimes[0] !== undefined) {
//        const loadProcess = 100 - convertNumberToPercent(myPlayer.spellsBuffer.reloadsTimes[0], myPlayer.actualSpell.reload[0] * 1000);
//        const drawingProcess = 65 * loadProcess / 100;

//        ctxUi.fillRect(850, 120, drawingProcess, 65);
        ctxUi.fillStyle = 'red';
        ctxUi.fillText(myPlayer.spellsBuffer.reloadsTimes[0],125, 570);
    }
    
//    ctxUi.fillStyle = 'red';
//    ctxUi.fillRect(15, 0, -35, 8);

    const {name, type} = myPlayer.weapon;
    const {actualAmmunition, maxMagazine, reloading, allAmmunition} = myPlayer.ammunition[0];
    
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