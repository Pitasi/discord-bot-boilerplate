const config = require('./config.js')

/* START EDITING HERE */
let commands = {
  ping: {
    desc: 'Simple test command',
    exec: (bot, msg) => {
      bot.createMessage(msg.channel.id, 'PONG!')
    }
  }
}

/* END EDITING HERE */

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
      let txt = `Use **${config.prefix}help <cmd>** for command's details\n`
      txt += Object.keys(commands).map(c=>(config.prefix+c)).join('\n')
      bot.createMessage(msg.channel.id, txt)
    }
  }
}

module.exports = commands
