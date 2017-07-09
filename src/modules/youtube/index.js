/* A more complex example - let's stream audio from YouTube! */
/* FEATURES:
    - join voice channel of the user (yep I saw bot that doesn't do that)
    - support all kind of youtube URLs
    - queue //TODO
    - search //TODO
    - playlists //TODO
*/

// 1 - Imports node modules
const prefix = require('../../config.js').prefix
const ytdl = require('ytdl-core')
const urlParser = require('js-video-url-parser')
const Queue = require('./queue.js')

// 2 - Auxiliary functions
let conns = {} // objects with server->conn pairs
let queues = {} // object with server->queue pairs

let play = (bot, conn, msg) => {
  // Joined a new voice channel, initialize queue if not already present
  if (!queues[msg.member.guild.id])
    queues[msg.member.guild.id] = new Queue(
      (el, end) => {
        // New video begins
        let stream = ytdl.downloadFromInfo(el.info, { format: 'audioonly' })
        bot.createMessage(msg.channel.id, `Now playing **${el.info.title}**.\n${el.by}, that's for you!`)

        conn.play(stream)
        conn.once('end', end)
      },
      () => {
        // Queue ended
        bot.createMessage(msg.channel.id, 'Queue ended!\nUse **++play** to continue listening.')
        bot.leaveVoiceChannel(msg.member.voiceState.channelID)
        delete queues[msg.member.guild.id]
        delete conns[msg.member.guild.id]
      }
    )

  let q = queues[msg.member.guild.id]
  let parsed = urlParser.parse(msg.payload)
  if (parsed && parsed.provider !== 'youtube') return // parser supports other sites than YouTube but we don't care, do we?

  if (parsed && !parsed.list) {
    // Single video
    ytdl.getInfo(parsed.id, (err, info) => {
      if (err) {
        bot.createMessage(msg.channel.id, `Error: ${err}`)
        return console.error(err)
      }
      if (!q.isEmpty() || q.isPlaying())
        bot.createMessage(msg.channel.id, `Queue: added **${info.title}**.\nRequested by ${msg.author.mention}.`)
      q.add({ id: parsed.id, info: info, by: msg.author.mention })
    })
  }

  else if (parsed && parsed.list) {
    // Playlists
    bot.createMessage(msg.channel.id, `Playlist are not supported yet.`)
  }

  else {
    // Search
    bot.createMessage(msg.channel.id, `Invalid url, search is not supported yet.`)
  }

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

      // If already have a connections in this guild
      if (conns[msg.member.guild.id])
        play(bot, conns[msg.member.guild.id], msg)
      // Or join the voice channel
      else {
        bot.joinVoiceChannel(msg.member.voiceState.channelID).catch((err) => {
          bot.createMessage(msg.channel.id, 'Error joining voice channel: ' + err.message)
          console.log(err)
        }).then((conn) => {
          if(conn.playing)
            conn.stopPlaying()
          conn.on('error', (err) => { console.error(err) })
          conns[msg.member.guild.id] = conn
          play(bot, conn, msg)
        })
      }

      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  }
}
