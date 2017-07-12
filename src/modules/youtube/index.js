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
const ytpl = require('ytpl')
const ytsr = require('ytsr')
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
        if (conn.playing) conn.stopPlaying()

        let stream = ytdl(`http://www.youtube.com/watch?v=${el.id}`, { format: 'audioonly' })
        bot.createMessage(msg.channel.id, [
          `:arrow_forward: Now playing **${el.info.title}** (https://youtu.be/${el.id}).`,
          `${el.by}, that's for you!`
        ].join('\n'))

        conn.play(stream)
        conn.once('end', end)
      },
      () => {
        // Queue ended
        bot.createMessage(msg.channel.id, ':stop_button: Queue ended!\nUse **++play** to continue listening.')
        bot.leaveVoiceChannel(msg.member.voiceState.channelID)
        delete queues[msg.member.guild.id]
        delete conns[msg.member.guild.id]
      }
    )

  let q = queues[msg.member.guild.id]
  let parsed = urlParser.parse(msg.payload)
  if (parsed && parsed.provider !== 'youtube') return // parser supports other sites than YouTube but we don't care, do we?

  bot.createMessage(msg.channel.id, 'Loading...').then((loadmsg) => {
    if (parsed && !parsed.list) {
      // Single video
      ytdl.getInfo(parsed.id, (err, info) => {
        if (err) {
          bot.editMessage(loadmsg.channel.id, loadmsg.id, `Error: ${err}`)
          return console.error(err)
        }
        if (!q.isEmpty() || q.isPlaying())
          bot.editMessage(loadmsg.channel.id, loadmsg.id, `:information_source: Added to queue: **${info.title}** (https://youtu.be/${info.video_id}).\nRequested by ${msg.author.mention}.`)
        q.add({ id: parsed.id, info: info, by: msg.author.mention })
      })
    }

    else if (parsed && parsed.list) {
      // Playlists
      ytpl(parsed.list, {limit: 5}, (err, info) => {
        if (err) {
          bot.editMessage(loadmsg.channel.id, loadmsg.id, `Error: ${err}`)
          return console.error(err)
        }
        bot.editMessage(loadmsg.channel.id, loadmsg.id, `:information_source: Playlist added to queue: **${info.title}**`)
        info.items.forEach((video) => { q.add({ id: video.id, info: video, by: msg.author.mention }) })
      })

    }

    else {
      // Search
      bot.editMessage(loadmsg.channel.id, loadmsg.id, `:mag_right: Searching on YouTube...`)
      ytsr.search(msg.payload, {limit: 1}, (err, res) => {
        if (err) {
          bot.editMessage(loadmsg.channel.id, loadmsg.id, `Error: ${err}`)
          return console.error(err)
        }
        let found = false
        for (let i in res.items) {
          let v = res.items[i]
          if (v.type === 'video') {
            let parsed = urlParser.parse(v.link)
            q.add({ id: parsed.id, info: v, by: msg.author.mention })
            if (!q.isEmpty() || q.isPlaying())
              bot.editMessage(loadmsg.channel.id, loadmsg.id, `:information_source: Result found: **${v.title}** (http://youtu.be/${parsed.id}).\nRequested by ${msg.author.mention}.`)
            else
              bot.deleteMessage(loadmsg.channel.id, loadmsg.id, 'Flood control')
            found = true
            break
          }
        }

        if (!found) bot.editMessage(loadmsg.channel.id, loadmsg.id, `:x: Sorry ${msg.author.mention}, no videos were found for your query.`)
      })
    }
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
  },

  stop: {
    desc: 'TODO',
    exec: (bot, msg) => {
      if (!queues[msg.member.guild.id] || !conns[msg.member.guild.id]) {
        bot.createMessage(msg.channel.id, `:x: ${msg.author.mention}, nothing is being played!`)
      }
      else {
        queues[msg.member.guild.id].empty()
        conns[msg.member.guild.id].stopPlaying()
        delete conns[msg.member.guild.id]
        delete queues[msg.member.guild.id]
        bot.createMessage(msg.channel.id, `:frowning2: Bot stopped by ${msg.author.mention}`)
      }
      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  },

  skip: {
    desc: 'TODO',
    exec: (bot, msg) => {
      if (!queues[msg.member.guild.id]) {
        bot.createMessage(msg.channel.id, `${msg.author.mention}, nothing is being played!`)
      }
      else {
        bot.createMessage(msg.channel.id, `:fast_forward: Skipping...\nRequested by ${msg.author.mention}`)
        queues[msg.member.guild.id].skip()
      }

      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  },

  pause: {
    desc: 'If a video is being played, pause it.',
    exec: (bot, msg) => {
      if (conns[msg.member.guild.id] && conns[msg.member.guild.id].playing) {
        bot.createMessage(msg.channel.id, `:pause_button: Paused. Use **${prefix}resume** to rock again!\nRequested by ${msg.author.mention}`)
        conns[msg.member.guild.id].pause()
      }
      else {
        bot.createMessage(msg.channel.id, `:x: ${msg.author.mention}, nothing is being played!`)
      }
      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  },

  resume: {
    desc: 'If bot is paused, resume playing.',
    exec: (bot, msg) => {
      if (conns[msg.member.guild.id] && conns[msg.member.guild.id].paused) {
        bot.createMessage(msg.channel.id, `:arrow_forward: Finally unleashed again!\nThank you ${msg.author.mention}`)
        conns[msg.member.guild.id].resume()
      }
      else {
        bot.createMessage(msg.channel.id, `:x: ${msg.author.mention}, bot is not paused!`)
      }
      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  },

  queue: {
    desc: 'Shows the currently scheduled videos.',
    exec: (bot, msg) => {
      if (queues[msg.member.guild.id] && queues[msg.member.guild.id].list.length > 0) {
        let list = queues[msg.member.guild.id].list
        let txt = ':page_with_curl: Queue: \n'
        for (let i = 0; i < list.length; i++)
          txt += `${i+1}) **${list[i].info.title}** (https://youtu.be/${list[i].id}).\n`

        bot.createMessage(msg.channel.id, txt)
      }
      else {
        bot.createMessage(msg.channel.id, `:information_source: Queue is empty! Start adding videos with **${prefix}play**`)
      }
      bot.deleteMessage(msg.channel.id, msg.id, 'Flood control')
    }
  }
}
