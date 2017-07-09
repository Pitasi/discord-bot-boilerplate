const config = require('./config.js')
const path = require('path').join(__dirname, 'modules')

/* Import every file or folders in modules/ */
let commands = {}
require("fs").readdirSync(path).forEach((file) => {
  Object.assign(commands, require('./modules/' + file))
})

/* Help command needs to access commands list itself */
commands.help = {
  desc: [
    `Usage: **${config.prefix}help** for a list of commands`,
    `OR **${config.prefix}help <cmd>** for command's details.`
  ].join('\n'),
  exec: (bot, msg) => {
    let cmd = msg.payload
    if (msg.payload && cmd in commands) {
      let txt = `**${config.prefix}${cmd}**: ${commands[cmd].desc || 'No description available'}`
      bot.createMessage(msg.channel.id, txt)
    }
    else {
      let txt = `Use **${config.prefix}help <cmd>** for command's details.\nList:\n`
      txt += Object.keys(commands).map(c=>(config.prefix+c)).join('\n')
      bot.createMessage(msg.channel.id, txt)
    }
  }
}

module.exports = commands
