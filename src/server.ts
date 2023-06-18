import { app, BrowserWindow, session, ipcMain, type App } from 'electron'
import * as os from 'os'
import { Gpio } from 'onoff'
import Recorder from './utils/recorder'
import * as fs from 'fs'
import * as path from 'path'
const DEBOUNCE_TIMEOUT = 10000 // 10 secondes en millisecondes
const buzzer = new Gpio(16, 'in', 'rising', { debounceTimeout: DEBOUNCE_TIMEOUT })
const cancel = new Gpio(26, 'in', 'rising', { debounceTimeout: DEBOUNCE_TIMEOUT })
const recorder = new Recorder()

let lastPressTime = 0
let mainWindow: BrowserWindow | null
let application: App
const reactDevToolsPath = path.join(
  os.homedir(),
  '/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.9.0_0'
)

function onWindowAllClosed (): void {
  if (process.platform !== 'darwin') {
    application.quit()
  }
}

function onClose (): void {
  mainWindow = null
}

function onReady (): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    kiosk: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  void mainWindow.loadURL('file://' + __dirname + '/client/index.html')
  // eslint-disable-next-line no-constant-condition
  if (false) void session.defaultSession.loadExtension(reactDevToolsPath)
  mainWindow.on('closed', onClose)
}

function main (appInstance: App): void {
  application = appInstance
  application.on('window-all-closed', onWindowAllClosed)
  application.on('ready', onReady)
}

ipcMain.on('get-images', (event) => {
  fs.readdir(path.resolve(__dirname, '..', 'slides'), (err, files): void => {
    if (err != null) {
      console.error('Could not read directory:', err)
      return
    }

    const images = files.map(file => path.join(path.resolve(__dirname, '..', 'slides'), file))
    event.reply('images', images)
  })
})

main(app)

buzzer.watch((err, value) => {
  if (err != null) {
    throw err
  }
  const currentTime = Date.now()

  if (currentTime - lastPressTime > DEBOUNCE_TIMEOUT) {
    recorder.startRecording()
    if (mainWindow != null) mainWindow.webContents.send('gpio', 'buzzer_on_play')
    lastPressTime = currentTime
  }
})

cancel.watch((err, value) => {
  if (err != null) {
    throw err
  }
  const currentTime = Date.now()

  if (currentTime - lastPressTime > DEBOUNCE_TIMEOUT) {
    recorder.stopRecording()
    if (mainWindow != null) mainWindow.webContents.send('gpio', 'cancel')
    lastPressTime = currentTime
  }
})

process.on('SIGINT', _ => {
  buzzer.unexport()
  cancel.unexport()
})
