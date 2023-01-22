import {Invetory, Slot, fillInvetoryWithSlots} from './invetory.js';
import {Hitbox, checkCollisionWith} from './hitbox.js';
import {Timer, Tick, timeLoop} from './lib/time.js';
import {Spell, SpellsBuffer, renewMagicEnergy} from './spell.js';
import {interpeter} from './text.js';//TODO: Chwilowa nazwa pliku!!!
import {Player} from './player.js';
import {Weapon} from './weapon.js';
import {Bullet} from './bullet.js';
import {Enemy} from './enemy.js';
import {Item} from './item.js';
import {Map, Chunk, generatePlane} from './map.js';
import {Staff} from './staff.js';
import {GameChests, Chest} from './chest.js';
import {KeyboardInput} from './keyboard.js';
import {GameObjects, Object} from './gameObjects.js';
import {Block} from './block.js';
import {loadMenuLanguage, polishLanguageMenuUi, englishLanguageMenuUi, langConvert} from './language.js';
export {generalTimer,drawText};

//Language
let menuUi = [
    'Hp:',
    'Your weapon:',
    'Type:',
    'Reloading...'
];
let gameLanguage = 'PL';

menuUi = loadMenuLanguage(menuUi, polishLanguageMenuUi);
//Language

const gameMap = new Map();
generatePlane(5, gameMap);

//Canvas Variables
const can = document.getElementById('gra'), ctx = can.getContext('2d');
const canWidth = can.width, canHeight = can.height;
//Canvas Variables

//Weapon's and Item's Variable
const trialAmmunition1 = 'Pistol/Caliber9mm/Pistolet NTB',
    trialAmmunition2 = 'Crosbow/ArrowHeadSize20mm/Kusza z XIV wieku',
    trialAmmunition3 = 'Rifle/Caliber12mm/Adminowy Karabin Maszynowy',
    trialAmmunition4 = 'Pistol/Caliber12mm/Pistolet XD';
let actalIdOfAmmunition = 0;

let cursorMode = 'moving';
let gameState = 'fight';

const blocks = [
    new Block(1000,1560,20,100, new Hitbox (50,50,50,50), 'stone')
];
console.log(blocks[0]);

let gameObjects = new GameObjects();

//SPELLS
const playerSpells = [
    new Spell('Błyskawica', 18, 'dmg', 'thunderboltAttack', 'enemy:1', 2, 14, 18),
    new Spell('Kula Ognia', 26, 'dmg', 'ballOfFire', 'direction:hitenemy:1', 3, 28, 31),
    new Spell('Magiczna pułapka', 24, 'dmg', 'magicTrap', 'direction:hitenemy:1', 2.6, 12, 27),
    new Spell('Niepamięć', 23, 'time', 'oblivion', 'enemy:1', 7, null, null, 4)
];

const playerSpellsBuffer = new SpellsBuffer('player');
let actualPlayerSpell = playerSpells[3];
let healthingPlayer = false;
//const newStaff = new Staff('Laska Leśnego Magika', ['reload:70']);
//newStaff.onUse(playerSpells);


//IMG DATABASE
const skeletonMeleeSpriteSheet = new Image();
skeletonMeleeSpriteSheet.src = 'img/spritesheet/skeleton-melee.png';
let skeletonMeleeSpriteSheetYPosWalkingLeft = 590;
//IMG DATABASE
//SPELLS

const trialWeapon1 = new Weapon('Sztylet', 15, 26, 1, 20, 340, 'melee'),
    trialWeapon2 = new Weapon('Kusza z XIV wieku', 6, 15, 5, 35, 16, 'distance',  3, [1,1,false,360,trialAmmunition2, 450]),
    trialWeapon3 = new Weapon('Pistolet XD', 26, 30, 5, 35, 16, 'distance', 8, [20,20,false,500,trialAmmunition1, 500]),
    trialWeapon4 = new Weapon('Adminowy Karabin Maszynowy',1*99*99*99*999*999,1*99*99*99*999*999,15,8,15,'distance',15, ['infinity',1,false,1,trialAmmunition3, 1000]);

const items = [
    new Item('Test01',3,0,'test01',false),
    new Item('Test02',7,0,'test02',false)
]; //Weapon's and Item's Variables
//Definition of Class
const enemy1 = new Enemy(20, 600, 50, 65, 40, trialWeapon1, new Hitbox(undefined, undefined, 50, 65), 2, 1, items[0], 1);
const enemyHitbox = new Hitbox(enemy1.x, enemy1.y, enemy1.width, enemy1.height);

const hitbox1 = new Hitbox(undefined, undefined, 50, 65);
const player1 = new Player(canWidth/2-50, (canHeight/2)-65, 50, 65, 300, 300, undefined, hitbox1, 4, 80, 130, [[trialAmmunition1, 15],[trialAmmunition2, 3],[trialAmmunition3,'infinity']]);
player1.weapon = trialWeapon3;
const playerInvetory = new Invetory();
const gameChests = new GameChests();
gameChests.chests.push(new Chest(50,50,50,50, new Hitbox(50,50,50,50),'nothing'));
const generalTimer = new Timer(), keyboardPlayerInput = new KeyboardInput(); 
playerInvetory.numberOfBasicSlots = 15;
playerInvetory.basicSlots.length = 15;
//Definition of Class

fillInvetoryWithSlots(playerInvetory);


const bullets = [];

let showWeaponStatistic = false;
let showMap = false;

const playerAmmunition = [
    [trialAmmunition1, 80], 
    [trialAmmunition2, 2],
    [trialAmmunition3, 'infinity']
];

const enemies = [
    /*new Enemy(0, 360, 700, 50, 65, 1, 1,trialWeapon1, new Hitbox(undefined, undefined, 50, 65), 2, 1, items[0], 1, 1, [[trialAmmunition1, 'infinity'], [trialAmmunition3, 'infinity']]),*/
    new Enemy(1, 780, 500, 50, 65, 80, 80, trialWeapon3, new Hitbox(undefined, undefined, 50, 65), 2, 1, items[0], 1, 0, [[trialAmmunition1, 'infinity'], [trialAmmunition3, 'infinity']])/*,
    new Enemy(2, 200, 450, 50, 65, 80, 80,trialWeapon2, new Hitbox(undefined, undefined, 50, 65), 2, 1, items[0], 1, 0, [[trialAmmunition1, 'infinity'], [trialAmmunition3, 'infinity']]),
    new Enemy(3, 780, 320, 50, 65, 90, 90,trialWeapon2, new Hitbox(undefined, undefined, 50, 65), 2, 1, items[0], 1, 0, [[trialAmmunition1, 'infinity'], [trialAmmunition3, 'infinity']])*/
];

let playerIsMove = false;
can.onmousedown = (e) => { 
    if (e.button === 0) {
        playerIsMove = true;    
    }
}
can.onmouseup = (e) => { 
    if (e.button === 0) {
        playerIsMove = false;
    }
}

gameObjects.addObject(enemies[0]);
console.log(gameObjects);

console.group('_MAIN');
console.log('Enemies: ',enemies);
console.log('Player: ',player1);
console.log('Weapons: ',trialWeapon1,trialWeapon2,trialWeapon3,trialWeapon4);
console.log('Items: ',items);
console.log('Invetory: ',playerInvetory);
console.groupEnd('_MAIN');


let attackList = [];

let mouseX;
let mouseY;
document.addEventListener('mousemove', (e) => {
  mouseX = e.offsetX;
  mouseY = e.offsetY;
});

can.addEventListener('click', e => {
    for (const enemy of enemies) {
        const collisionWith = checkCollisionWith(player1.hitbox, enemy.hitbox);    
        player1.playerAttack(e, collisionWith, enemy, generalTimer, playerAmmunition);
    }
    if (cursorMode === 'moving') {
        //player1.movingPlayer(e.offsetX, e.offsetY, e);    
    } else if (cursorMode === 'marking') {
        let counter = 0;
        let uses = false;
        const cursorHitbox = new Hitbox(e.offsetX ,e.offsetY , 10, 10); 
        for (const enemy of enemies) {
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
                        
                        setTimeout(()=>{console.log(enemy.aiState)}, 100);
                        
                        setTimeout(()=> {
                            enemy.aiState = oldAiState;
                            enemy.secondAiState = oldSecondAiState;    
                        }, actualPlayerSpell.time * 1000);
                    }
                    cursorMode = 'moving';   
                    counter++;
                }
            }
            if(Number(actualPlayerSpell.availablesObjects.substr(6)) <= counter) {
                uses = true;
                playerSpellsBuffer.spells.push(actualPlayerSpell.name);
                playerSpellsBuffer.reloadsTimes.push(actualPlayerSpell.reload*1000);
            }
        }
    } else if (cursorMode === 'direction') {
        const {x, y} = player1;
        const {action, minDmg, maxDmg} = actualPlayerSpell;
        const {offsetX, offsetY} = e;
        let bulletWidth, bulletHeight;
        if (action === 'ballOfFire') {
            bulletWidth = 50;
            bulletHeight = 50;    
        } else if (action === 'magicTrap') {
            bulletHeight = 25;    
            bulletWidth = 25;    
        }
        player1.magicEnergy -= actualPlayerSpell.requiredMagicEnergy;
        playerSpellsBuffer.spells.push(actualPlayerSpell.name);
        playerSpellsBuffer.reloadsTimes.push(actualPlayerSpell.reload*1000);
        
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
        can.style.cursor = 'auto';
    }
});

can.addEventListener('contextmenu', e => {
    e.preventDefault();
    for (const enemy of enemies) {
        const collisionWith = checkCollisionWith(player1.hitbox, enemy.hitbox);
        player1.playerAttack(e, collisionWith, enemy, generalTimer, playerAmmunition);
        break;
    }
});

document.addEventListener('keyup', e => {
    for (const enemy of enemies) {
        const collisionWith = checkCollisionWith(player1.hitbox, enemy.hitbox);
        if (player1.weapon.type === 'melee') {
            player1.playerAttack(e, collisionWith, enemy, generalTimer);
        }
    }
    
    if (e.altKey) {
        const key = Number(e.key);
        if (key <= playerSpells.length) {
            actualPlayerSpell = playerSpells[key-1];
        }
    }
    
    if (!e.altKey) {
        if (e.keyCode === 49) {
            player1.weapon = trialWeapon1;
        } else if (e.keyCode === 50) {
            actalIdOfAmmunition = 1;
            player1.weapon = trialWeapon2;
        } else if (e.keyCode === 51) {
            actalIdOfAmmunition = 0;
            player1.weapon = trialWeapon3;
        } else if (e.keyCode === 52) {
            player1.weapon = trialWeapon4;
        }
    }
    
    if (e.keyCode === 80) {
        showWeaponStatistic = !showWeaponStatistic;
    } else if (e.keyCode === 82) {
        player1.weapon.reload(generalTimer,playerAmmunition);
    } else if (e.keyCode === 32) {
        for (const chest of gameChests.chests) { 
            console.log(chest.hitbox);
            if (checkCollisionWith(player1.hitbox, chest.hitbox)) {
                chest.open(player1, playerInvetory);
                console.log('a'); 
            }
        } 
    } else if (e.keyCode === 84) {
        //enemy1 = new Enemy(20, 600, 50, 65, 40, trialWeapon1, new Hitbox(undefined, undefined, 50, 65), 2, 1, 'gold', 4);
    } else if (e.keyCode === 73) {
        playerInvetory.show = !playerInvetory.show;
    } else if (e.keyCode === 69) {
        cursorMode = actualPlayerSpell.bewitch(cursorMode, player1, 'player', playerSpellsBuffer);
        if (cursorMode === 'marking') {
            can.style.cursor = 'crosshair';
        } else if (cursorMode === 'direction') {
            can.style.cursor = 'pointer';   
        } else {
            can.style.cursor = 'auto';
            cursorMode = 'moving';
        }
    } else if (e.keyCode === 77) {
        showMap = !showMap;    
    }
}); 

let playerHpWidthCounter;
let oldplayerHpWidthCounter = 276;

function drawPlayerStatistics() {
    const hpPercent = convertNumberToPercent(player1.hp, player1.maxHp);
    const magicEnergyPercent = convertNumberToPercent(player1.magicEnergy, player1.maxMagicEnergy);
    const actualSpellOfMagicEnergyPercent = convertNumberToPercent(actualPlayerSpell.requiredMagicEnergy, player1.maxMagicEnergy);
    const width = 275;
    const hpPercentWidth = width * hpPercent / 100;
    const magicEnergyPercentWidth = width * magicEnergyPercent / 100;
    const actualSpellOfMagicEnergyPercentWidth = width * actualSpellOfMagicEnergyPercent / 100;
    const to = 15 + magicEnergyPercentWidth;
    const from = to - actualSpellOfMagicEnergyPercentWidth;
    playerHpWidthCounter = hpPercentWidth;
    if (oldplayerHpWidthCounter >= playerHpWidthCounter && !healthingPlayer) {
        oldplayerHpWidthCounter -= 1.4;
    } else if (oldplayerHpWidthCounter <= playerHpWidthCounter && healthingPlayer) {
        oldplayerHpWidthCounter += 1.2;
    }
    ctx.fillStyle = '#4A2323';
    ctx.fillRect(15, 5, width, 20);
    ctx.fillStyle = '#f74d4d';
    if (hpPercent >= 0) {
        ctx.fillRect(15, 5, oldplayerHpWidthCounter, 20);    
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
    }
    
}

function drawMap() {
    const zoom = 4;
    const mapWidth = 800;
    const mapHeight = 500;
    const x = (canWidth - mapWidth) / 2;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#a9acb0';
    ctx.fillRect(x, 150, mapWidth, mapHeight);
    ctx.globalAlpha = 0.18;
}

function drawMiniMap() {
    const scale = 4;
    ctx.fillStyle = '#46515c';
    ctx.globalAlpha = 0.25;
    const width = canWidth/scale;
    const height = canHeight/scale;
    ctx.fillRect(780, 20, width,height);
    const mapHitbox = new Hitbox(780, 20, width, height);
    ctx.fillStyle = '#FB8C34';
    for (const enemy of enemies) {
        const x = enemy.x / scale + 780;
        const y = enemy.y / scale + 20;
        const enemyHitbox = new Hitbox(x, y, enemy.width/scale, enemy.height/scale);
        if (enemy.isAlive && checkCollisionWith(mapHitbox, enemyHitbox)) {
            ctx.fillRect(x, y, enemy.width/scale, enemy.height/scale);    
        }
    }
    ctx.fillStyle = '#239db0';
    for (const chest of gameChests.chests) {
        const x = chest.x / scale + 780;
        const y = chest.y / scale + 20;
        const chestHitbox = new Hitbox(x, y, chest.width/scale, chest.height/scale);
        if (checkCollisionWith(mapHitbox, chestHitbox) && !chest.isOpen) {
            ctx.fillRect(x, y, chest.width/scale, chest.height/scale);    
        }
    }
    ctx.globalAlpha = 1.0;
}

function drawAll() {
    ctx.clearRect(0, 0, canWidth,canHeight);
    player1.drawPlayer(ctx);
    drawPlayerStatistics();
    for (const enemy of enemies) {
        enemy.drawEnemy(ctx, '#FB8C34');
    }
    for (const bullet of bullets) { 
        bullet.drawBullet(ctx);
    }
    for (const chest of gameChests.chests) { 
        chest.drawChest(ctx);
    }
    for (const block of blocks) { 
        block.drawBlock(ctx);
    }
    drawMiniMap();
    if (showMap) {
        drawMap();
    }
    ctx.strokeRect(1135,20,50,65);
    ctx.fillStyle = '#bbbcbd';
    ctx.fillRect(1135,20,50,drawingProcess);
    playerInvetory.drawInvetory(ctx, drawTextManyLines);
    drawText(15,65,menuUi[1]+player1.weapon.name, 'black', 22);
    drawText(15,115,menuUi[2]+langConvert(player1.weapon.type, gameLanguage));
    drawText(15,140,'Zaklęcie:'+actualPlayerSpell.name);
    if (player1.weapon.type === 'distance') {
        const shoots = (player1.weapon.distanceOptions[0])+(player1.ammunition[actalIdOfAmmunition][1]);
        drawText(15, 90, player1.weapon.distanceOptions[0] + '/' + player1.weapon.distanceOptions[1] + '  ' + player1.ammunition[actalIdOfAmmunition][1] + '  ' + shoots);
        if (player1.weapon.distanceOptions[2]) {
            drawText(15, 125, menuUi[3]);
        }
    }
    
    if (showWeaponStatistic) {
        drawText(15,85,'MinDmg:'+player1.weapon.minDmg);
        drawText(15,105,'MaxDmg:'+player1.weapon.maxDmg);
    }
    requestAnimationFrame(drawAll);
}

function drawText(textX, textY, textToDisplay, fontColor, fontSize, fontFamily = 'Monospace') {
    ctx.fillStyle = fontColor;
    ctx.font = fontSize + 'px ' + fontFamily;
    ctx.fillText(textToDisplay, textX, textY);
}

function drawTextManyLines(textX, textY, textToDisplay, fontColor, fontSize, fontFamily = 'Monospace', lines, optionalTextAdds = 0) {
    let counterY = textY;
    for (let i = 0; i < lines; i++) {
        if (optionalTextAdds === 'Invetory/content') {
            drawText(textX, counterY, langConvert(textToDisplay[i].content, gameLanguage), fontColor, fontSize, fontFamily);
        } else {
            drawText(textX, counterY, textToDisplay[i], fontColor, fontSize, fontFamily);
        }
        counterY += fontSize + 2;
    }
}

function gameLoop() {
    const {
        listOfTicks
    } = generalTimer;

    updateHitboxs();

    for (const enemy of enemies) {
        if (enemy.aiState !== 'dodge') {
            if (enemy.weapon.type === 'distance' && enemy.aiState !== 'shooting') {
                enemy.secondAiState = 'icanshoot?';
            }
            if (checkCollisionWith(player1.hitbox, enemy.hitbox) && enemy.weapon.type === 'melee' && enemy.aiState !== 'oblivion') {
                if (enemy.aiState != 'toattack') {
                    generalTimer.listOfTicks.push(new Tick('EnemyLightAttack EnemyId:' + enemy.id, generalTimer.generalGameTime, generalTimer.generalGameTime + enemy.weapon.speedLightAttack));
                }
                enemy.aiState = 'toattack';
            } else {
                if (enemy.weapon.type === 'distance' && enemy.aiState !== 'shooting' && enemy.aiState !== 'oblivion') {
                    enemy.aiState = 'quest';
                } else if (enemy.weapon.type !== 'distance' && enemy.aiState !== 'oblivion') {
                    enemy.aiState = 'quest';
                }
                
                for (const tick of listOfTicks) {
                    if (enemy.weapon.type === 'melee' && tick.nameOfTick === 'EnemyLightAttack EnemyId:' + enemy.id && !tick.done) {
                        tick.old = true;
                        break;
                    }
                }
            }
        }
    }

    bullets.forEach((bullet, i) => {
        if (bullet.hitbox != null) {
            for (const enemy of enemies) {
                if (checkCollisionWith(bullet.hitbox, enemy.hitbox) && enemy.hitboxActive && bullet.owner === 'player') {
                    const givenDmg = Math.floor(Math.random() * (bullet.maxDmg - bullet.minDmg + 1) + bullet.minDmg);
                    enemy.hp -= givenDmg;
                    bullets.splice(i, 1);
                }
            }
            if (checkCollisionWith(bullet.hitbox, player1.hitbox) && bullet.owner.substr(0, 5) === 'enemy') {
                const givenDmg = Math.floor(Math.random() * (bullet.maxDmg - bullet.minDmg + 1) + bullet.minDmg);
                player1.hp -= givenDmg;
                bullets.splice(i, 1);
            }
        }
    });
}

function updateHitboxs()
{
    for (const bullet of bullets) {
        bullet.hitbox.x = bullet.x;
        bullet.hitbox.y = bullet.y;
    }
    for (const chest of gameChests.chests) {
        chest.hitbox.x = chest.x;
        chest.hitbox.y = chest.y;
    }
    player1.hitbox.x = player1.x;
    player1.hitbox.y = player1.y;
    for (const enemy of enemies) {
        if (enemy.hitboxActive) {
            enemy.hitbox.x = enemy.x;   
            enemy.hitbox.y = enemy.y; 
        }
    }
    for (const block of blocks) {
        block.hitbox.x = block.x;   
        block.hitbox.y = block.y; 
    }
}

function enemyLoop() {
    for (const enemy of enemies) {
        enemy.enemyAi(attackList, player1, generalTimer, gameChests, bullets);    
    }
    const allEnemiesDead = enemies.every(enemy => !enemy.isAlive);
    if (allEnemiesDead && gameState !== 'nohostilities') {
        gameState = 'nohostilities';
        healthingPlayer = true;
    }
    bullets.forEach((bullet, x) => {
        bullet.move();
        if(bullet.speed === 0) {
            bullets.splice(x, 1);
        }
    });
}

function convertNumberToPercent(part, all) {
    return (part/all)*100;
}

let loadProcess = 100;
let drawingProcess = 65 * loadProcess / 100;


function playerLoop() {
    const listOfTicks = generalTimer.listOfTicks;
    if (cursorMode === 'moving' && playerIsMove) {
        player1.movingPlayer(mouseX, mouseY);
        let filterBullets = [];
        for (const bullet of bullets) {
            console.error(bullet.owner.substring(0, 5) === 'enemy');
            if (!bullet.owner.substring(0, 5) === 'enemy') {
                filterBullets.push(bullet);
                console.log(bullet, bullet.owner.substring(0, 5));
            }
        }
        console.log(bullets, filterBullets);
        player1.playerMove(blocks, enemies, filterBullets, gameChests.chests);
    }
    let playermagicEnergyPerSecond = 0.2;

    if (gameState === 'nohostilities') {
        if (healthingPlayer) {
            player1.hp += 0.125;    
        }
        const hpPercent = convertNumberToPercent(player1.hp, player1.maxHp);
        if (hpPercent >= 60) {
            healthingPlayer = false;
        }
        playermagicEnergyPerSecond = 0.05;
    }
    
    renewMagicEnergy(player1, playermagicEnergyPerSecond);
    
    const lenght = playerSpellsBuffer.spells.length;
    for (let i = 0; i < lenght; i++) {
        playerSpellsBuffer.reloadsTimes[i] -= 25;
        loadProcess = 100 - convertNumberToPercent(playerSpellsBuffer.reloadsTimes[i], actualPlayerSpell.reload*1000);
        drawingProcess = 65 * loadProcess / 100;
        if (playerSpellsBuffer.reloadsTimes[i] <= 0) {
            playerSpellsBuffer.reloadsTimes.splice(i, 1);
            playerSpellsBuffer.spells.splice(i, 1);
        }
    }

    for (const tick of listOfTicks) {
        if (tick.nameOfTick === 'Reloading a player distance weapon' && tick.done && !tick.old) {
            tick.old = true;
            player1.weapon.distanceOptions[2] = false; //isReloading = false
            player1.weapon.distanceOptions[0] = player1.weapon.distanceOptions[1]; //magazine = fullmagazine
            break;
        }
    }
}


function bulletsLoop() {
    const listOfTicks = generalTimer.listOfTicks;

    for (const tick of listOfTicks) {
        if (tick.nameOfTick.substr(0, 17) === 'Creating a Bullet' && tick.done && !tick.old) {
            let rawData = interpeter(tick.nameOfTick);
            rawData[0] = parseInt(rawData[0].substring(2)); //x
            rawData[1] = parseInt(rawData[1].substring(2)); //y
            rawData[2] = parseInt(rawData[2].substring(6)); //width
            rawData[3] = parseInt(rawData[3].substring(7)); //height
            rawData[4] = parseInt(rawData[4].substring(6)); //speed
            rawData[5] = parseInt(rawData[5].substring(7)); //mindmg   
            rawData[6] = parseInt(rawData[6].substring(7)); //maxdmg
            rawData[7] = parseInt(rawData[7].substring(8)); //targetX
            rawData[8] = parseInt(rawData[8].substring(8)); //targetY
            rawData[9] = rawData[9].substring(6); //owner
            
            enemyId:
            if (rawData[10] === undefined) {
                rawData[10] = 500;
                for (const enemy of enemies) {
                        if (enemy.id === Number(rawData[9].substr(8))) {
                            rawData[10] = enemy.weapon.distanceOptions[5];
                            break;
                        }
                }
            } else {
                rawData[10] = rawData[10].substring(9); //distance
            }

            bullets.push(new Bullet(rawData[0], rawData[1], rawData[2], rawData[3],
                new Hitbox(rawData[0], rawData[1], rawData[2], rawData[3]), rawData[4], rawData[5], rawData[6], rawData[7], rawData[8], rawData[9], rawData[10]));

            tick.old = true;
            for (const bullet of bullets) {
                if (bullet.owner === 'player') {
                    bullet.checkTheDirection(player1);
                } else {
                    for (const enemy of enemies) {
                        if (enemy.id === Number(bullet.owner.substr(8))) {
                            bullet.checkTheDirection(enemy);
                        }
                    }
                }
            }
            break;
        }
    }
}


setInterval(gameLoop, 12);
setInterval(enemyLoop, 25);
setInterval(playerLoop, 25);
setInterval(timeLoop, 1, generalTimer);
setInterval(bulletsLoop, 20);
requestAnimationFrame(drawAll);