import { app, BrowserWindow, type App } from 'electron'
import { Gpio } from 'onoff'
import Recorder from './utils/recorder'
const buzzer = new Gpio(16, 'in', 'both')
const cancel = new Gpio(26, 'in', 'both')
const recorder = new Recorder()

let mainWindow: BrowserWindow | null
let application: App

function onWindowAllClosed (): void {
  if (process.platform !== 'darwin') {
    application.quit()
  }
}

function onClose (): void {
  mainWindow = null
}

function onReady (): void {
  mainWindow = new BrowserWindow({ width: 800, height: 600, kiosk: true })
  void mainWindow.loadURL('file://' + __dirname + '/client/index.html')
  mainWindow.on('closed', onClose)
}
function main(appInstance: App): void {
  application = appInstance
  application.on('window-all-closed', onWindowAllClosed)
  application.on('ready', onReady)
}

main(app)

buzzer.watch((err, value) => {
  if (err != null) {
    throw err
  }
  recorder.startRecording()
  if (mainWindow != null) mainWindow.webContents.send('gpio', 'Hello from Main Process')
})

cancel.watch((err, value) => {
  if (err != null) {
    throw err
  }
  if (mainWindow != null) mainWindow.webContents.send('gpio', 'Hello from Main Process')
})

process.on('SIGINT', _ => {
  buzzer.unexport()
  cancel.unexport()
})
