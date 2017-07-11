/* Simple FIFO queue class for requests */

module.exports = class Queue {
  constructor (nextElement, queueEnded) {
    this.nextElement = nextElement
    this.queueEnded = queueEnded
    this.list = []
    this.playing = false
  }

  isEmpty()   { return this.list.length == 0 }
  isPlaying() { return this.playing }

  // New element in queue
  add (obj) {
    // New element
    if (this.isEmpty() && !(this.playing)) {
      this.playing = true
      this.nextElement(obj, this.ended.bind(this))
    }
    else this.list.push(obj)
  }

  // A video ended, let's begin next one
  ended (flag) {
    // A skip request call this function, then video ends and this
    // function gets called again - ignore the second one
    if (this.pending) {
      this.pending = false
      return
    }
    if (flag) this.pending = true

    let next = this.list.shift()
    if (next) this.nextElement(next, this.ended.bind(this))
    else {
      this.playing = false
      this.queueEnded()
    }
  }

  skip () { this.ended(true) }

  empty () {
    this.list = []
  }

}
