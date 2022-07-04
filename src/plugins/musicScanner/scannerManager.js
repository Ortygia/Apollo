const { fork } = require('child_process')

class ScannerManager {
  constructor(log) {
    this.log = log
    this.isScanning = false
    this.child = null
    this.isRunning = false
  }

  startChild() {
    this.child = fork('./src/plugins/musicScanner/process/init.js')
    this.child.on('exit', (code, signal) => {
      this.log.info('musicScanner process exited with ' +
                  `code ${code} and signal ${signal}`)
    })
    this.child.on('message', (event) => {
      switch (event.t) {
      case 'scanStatus':
        this.isScanning = event.message
        break
      case 'started':
        this.isRunning = true
        break
      }
    })
  }

  startScan() {
    this.child.send({ t: 'startScan' })
  }

  startPartialScan() {
    this.child.send({ t: 'startPartialScan' })
  }
}
module.exports = ScannerManager
