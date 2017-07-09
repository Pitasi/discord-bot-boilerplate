/* A more complex example - let's stream audio from YouTube! */
/* FEATURES:
    - join voice channel of the user (yep I saw bot that doesn't do that)
    - support all kind of youtube URLs
    - queue //TODO
    - search //TODO
    - playlists //TODO
*/

// 1 - Imports node modules
const prefix = require('../config.js').prefix
const ytdl = require('ytdl-core')

// 2 - Auxiliary functions
let play = (bot, conn, arg) => {
  if(conn.playing) conn.stopPlaying()
  let stream = ytdl(arg, { format: 'audioonly' })
  conn.play(stream)
  bot.createMessage(msg.channel.id, `Now playing **<${arg}>**`)
  conn.once('end', () => {
    bot.createMessage(msg.channel.id, `Finished **<${arg}>**`)
  })
}

// 3 - Commands definition
module.exports = {
  play: {
    desc: [
      `Play music from YouTube.`,
      `__Usage:__ **${prefix}play <url>**`,
      `__OR__ **${prefix}play <search string>**`,
      `Playlists are supported, if a song is already playing, your request will be added to queue.`
    ].join('\n'),
    exec: (bot, msg) => {
      if (!msg.payload || msg.payload.length == 0)
        return bot.createMessage(msg.channel.id, 'Please specify an URL or a search string.')
      if (!msg.channel.guild)
        return bot.createMessage(msg.channel.id, 'This command can only be used in a server.')
      if (!msg.member.voiceState.channelID)
        return bot.createMessage(msg.channel.id, 'Join a voice channel first.')

      bot.joinVoiceChannel(msg.member.voiceState.channelID).catch((err) => {
        bot.createMessage(msg.channel.id, 'Error joining voice channel: ' + err.message)
        console.log(err)
      }).then((conn) => play(bot, conn, msg.payload))
    }
  }
}
