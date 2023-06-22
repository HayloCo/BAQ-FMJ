import { app, BrowserWindow, session, ipcMain, type App } from 'electron'
import { list as getDrives } from 'drivelist'
import * as os from 'os'
// import Recorder from './utils/recorder'
import * as fs from 'fs'
import * as path from 'path'
// const recorder = new Recorder()

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
  if (true) void session.defaultSession.loadExtension(reactDevToolsPath)
  mainWindow.on('closed', onClose)
}

function main (appInstance: App): void {
  application = appInstance
  application.on('window-all-closed', onWindowAllClosed)
  application.on('ready', onReady)
}

ipcMain.on('get-drive', (event) => {
  void getDrives().then((drives) => {
    let pathUSB = ''
    drives.forEach((drive) => {
      if (drive.isUSB ?? false) {
        drive.mountpoints.forEach((mountpoint) => {
          if (mountpoint.label === 'UNTITLED') {
            pathUSB = mountpoint.path
          }
        })
      }
    })
    const files = fs.readdirSync(path.resolve(pathUSB, 'slides'))
    const images = files.map(file => path.join(path.resolve(pathUSB, 'slides'), file))
    event.reply('images', images)

    if (fs.existsSync(path.join(pathUSB, 'config.json'))) {
      const config = fs.readFileSync(path.join(pathUSB, 'config.json'))
      event.reply('config', config)
    }
  })
})

main(app)
