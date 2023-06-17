import { type ChildProcessWithoutNullStreams, spawn } from 'child_process'

class Recorder {
  scriptPath: string
  recordingProcess: ChildProcessWithoutNullStreams | null

  constructor () {
    this.scriptPath = './record.sh'
    this.recordingProcess = null
  }

  startRecording (): void {
    if (this.recordingProcess != null) {
      console.log('Recording already in progress.')
      return
    }

    this.recordingProcess = spawn(this.scriptPath)

    console.info('Recording started.')
  }

  stopRecording (): void {
    if (this.recordingProcess == null) {
      console.log('No recording in progress.')
      return
    }

    this.recordingProcess.kill('SIGTERM')
    this.recordingProcess = null

    console.info('Recording stopped.')
  }
}

export default Recorder
