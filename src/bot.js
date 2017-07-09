/*     INIT       */
const config = require('./config.js')
const commands = require('./commands.js')
const Eris = require('eris')
const bot = new Eris(config.token)
bot.on('ready', () => console.log('Bot ready!'));

/*     DISPATCHER   */
bot.on('messageCreate', msg => {
  if(!msg.content || !msg.content.startsWith(config.prefix)) return
  let i = msg.content.indexOf(' ')
  let cmd = msg.content.slice(config.prefix.length, i!=-1?i:undefined)
  msg.payload = i!=-1?msg.content.slice(i+1).trim():''
  if (cmd in commands) commands[cmd].exec(bot, msg)
})

bot.connect()
