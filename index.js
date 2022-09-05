//Use Lamda Functions!!!!!
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow
const armorManager = require('mineflayer-armor-manager')
const deathEvent = require('mineflayer-death-event')
const autoeat = require('mineflayer-auto-eat')

//Creates the bot with it's details, the server must be Cracked or a LAN server in order to join
//Port has to be put in manually every time you start a new LAN server, if it is a Cracked multiplayer server than 25565 works
const bot = mineflayer.createBot({
    host: "The_Fantaz.aternos.me", //For LAN, can change to a server ip
    port: 25565,
    username: "President",
    logErrors: false
})

//Loads "plugins" that add functionalities
bot.loadPlugin(pathfinder)
bot.loadPlugin(armorManager)
bot.loadPlugin(deathEvent)
bot.loadPlugin(autoeat)
bot.loadPlugin(deathEvent)

//Some global variables, self-explanatory
const distanceFromPlayer = 1
var mcData = null
var defaultMovementOption = null
var followingPlayer = false
var timer = 620
var gameIdle = true
var setRespawnPoint = true


function startGame(){
    gameIdle = false
    bot.chat('/title @a title {"text":"Starting Challenge"}')
    bot.chat('Challenge Started!')
    //Gives the bot more health, can be deleted to make challenge harder
    bot.chat('/effect give @p health_boost 1000000 4 true')
    bot.chat('/effect give @p regeneration 1000000 1 true')
    bot.chat('/effect give @p resistance 1000000 0 true')
}
function endGame(completed){
    if(gameIdle) return
    gameIdle = true
    //Right now the winning text won't activate as I couldn't find out how to detect the ender dragons death
    if(completed) bot.chat('/title @a title {"text":"You Win","bold":true,"color":"green"}')
    else bot.chat('/title @a title {"text":"You Lose","bold":true,"color":"red"}')

}

function reportStats(){
    bot.chat("I have " + ((Math.round((bot.health/2)) * 2) / 2).toFixed(1) + " hearts, and " + (Math.round((bot.food/2) * 2) / 2).toFixed(1) + " hunger bars.")
}

function startMoving(start){ 
    if(!start){
        //Give the bot no goal, making it stop moving
        bot.pathfinder.setGoal(null)
        return
    }
    //Finds nearest player and moves towards it
    const playerFilter = (entity) => entity.type === 'player'
    const playerEntity = bot.nearestEntity(playerFilter)
    if(!playerEntity) return
    bot.pathfinder.setMovements(defaultMovementOption)
    bot.pathfinder.setGoal(new GoalFollow(playerEntity,distanceFromPlayer),true)

}

function onPlayerDeath(deathData){
    if(gameIdle) return
    
    //The Hash is the bot's uuid, as that is how "mineflayer-death-event" shows who died. 
    //If this doesn't work, use console.log(deathData.victim.id) to see your bot's uuid 
    if(deathData.victim.id === '13a849bf-b224-3dd7-b9ac-fed5472945ba' || deathData.victim.id === bot.player.uuid){
        setTimeout(() =>endGame(false),50)
        console.log("bsdfsdf")
        startMoving(false)
    }else{
        //Player spawns near President, code can be deleted if needed
        if(setRespawnPoint){
            if(bot.game.dimension === 'minecraft:overworld') bot.chat("/setworldspawn")
        }
    }
    
}

function movementActions (){
    //Don't want to interfere facing direction during pathfinding
    if(followingPlayer) return 

    const playerFilter = (entity) => entity.type === 'player'
    const playerEntity = bot.nearestEntity(playerFilter)

    if(!playerEntity){
        //Only want the timer to be running if the challenge has started
        if(!gameIdle){
            //The function is called every 1 ingame second which allows it to be used as a timer

            //Bot hasn't seen player (ANYWHERE between 6 chunks) after 30 seconds
            if(timer == 0){
                timer = 620
                endGame(false)
            }

            if(timer%60==0)
                bot.chat("I can't find you! Game ending in " + (timer/20) + " seconds")
            timer--
        }
        return

    }
    //The number is lower due to the bot taking a few seconds to grab data
    if(timer < 620){
        if(timer < 600)
            bot.chat("Found a player!")
        timer = 620
    }
    bot.lookAt(playerEntity.position.offset(0,playerEntity.height,0))  
}

function dropItems(){
    if (bot.inventory.items().length === 0) return
    const item = bot.inventory.items()[0]
    bot.tossStack(item)
    //Time out (of 1 Minecraft Tick) needed to allow bot data to update
    setTimeout(() =>dropItems(),200)

}

function changeRespawnMode(bool){
    if(bool === 'on'){
        setRespawnPoint = true
        bot.chat('Bot now sets spawn when other players die (in the overworld only)')
    }
    else{
        setRespawnPoint = false
        bot.chat('Bot will not change spawn')
    }
}

function chatFunctions(username, message){
    message = message.toLowerCase();
    if(message === 'drop') dropItems()
    else if(message === 'stats') reportStats()
    else if(message === "start game") startGame()
    else if(message.split(' ')[0] === 'changespawn') changeRespawnMode(message.split(' ')[1])
    else if(message === 'move')  followingPlayer = !followingPlayer
    else if(message === 'stop') followingPlayer = false
    else if(message === 'start' || message === 'follow')    followingPlayer = true
    
    startMoving(followingPlayer)
}

function onHit(entity){
    if(!gameIdle) 
        if(entity == bot.entity) bot.chat("Ow, I've been hit")
}

bot.on('entityHurt', onHit)
bot.on('playerDeath', onPlayerDeath)
bot.on('physicTick', movementActions)
bot.on('chat', chatFunctions)

//These values cannot be set before logging on to the server, as they break the bot
bot.once("spawn", () => {
    //eatingTimeout set to 0 so bot doesn't waste time eating
    bot.autoEat.options.eatingTimeout = 0
    mcData = require('minecraft-data')(bot.version)
    defaultMovementOption = new Movements(bot, mcData)

    bot.chat("Go to https://github.com/TheFantaz/MPresProct to see chat commands")

  })
