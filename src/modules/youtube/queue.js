/* Simple FIFO queue class for requests */

module.exports = class Queue {
  constructor (nextElement, queueEnded) {
    this.nextElement = nextElement
    this.queueEnded = queueEnded
    this.list = []
    this.playing = false
  }

  isEmpty() { return this.list.length == 0 }
  isPlaying() { return this.playing }

  add (obj) {
    // New element
    if (this.isEmpty() && !(this.playing)) {
      this.playing = true
      this.nextElement(obj, this.ended.bind(this))
    }
    else this.list.push(obj)
  }

  ended () {
    // A video ended, let's begin next one
    let next = this.list.shift()
    if (next) this.nextElement(next, this.ended.bind(this))
    else {
      this.playing = false
      this.queueEnded()
    }
  }

}
