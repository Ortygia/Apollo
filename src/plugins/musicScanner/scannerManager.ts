import { ChildProcess, fork } from 'child_process'
import { BaseLogger } from 'pino'

interface Event {
  message: string,
  t: string
}
class ScannerManager {
  log: BaseLogger
  isScanning: boolean
  child: ChildProcess | null
  isRunning: boolean
  constructor(log: BaseLogger) {
    this.log = log
    this.isScanning = false
    this.child = null
    this.isRunning = false
  }

  startChild() {
    this.child = fork('./src/plugins/musicScanner/process/init.js')
    this.child.on('exit', (code: any, signal: any) => {
      this.log.info('musicScanner process exited with ' +
                  `code ${code} and signal ${signal}`)
    })
    this.child.on('message', (event: Event) => {
      switch (event.t) {
      case 'scanStatus':
        this.isScanning = Boolean(event.message)
        break
      case 'started':
        this.isRunning = true
        break
      }
    })
  }

  startScan() {
    if (this.child) {
      this.child.send({ t: 'startScan' })
    }
  }

  startPartialScan() {
    if (this.child) {
      this.child.send({ t: 'startPartialScan' })
    }
  }
}
export default ScannerManager
