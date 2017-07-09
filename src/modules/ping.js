// Simplest module
// Declares one single command: ping

module.exports = {
  ping: {
    desc: 'Simple test command',
    exec: (bot, msg) => {
      bot.createMessage(msg.channel.id, 'PONG!')
    }
  }
}
