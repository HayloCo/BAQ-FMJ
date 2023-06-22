import { app, BrowserWindow, ipcMain, type App } from 'electron'
import { list as getDrives } from 'drivelist'
import { FFmpeg } from 'kiss-ffmpeg'
// import Recorder from './utils/recorder'
import * as fs from 'fs'
import * as path from 'path'
// const recorder = new Recorder()

let mainWindow: BrowserWindow | null
let application: App
let pathUSB: string

const ffmpegInstance: FFmpeg = new FFmpeg(
  {
    inputs: { url: '/dev/video0', options: { f: 'video4linux2', s: '1920x1080', pix_fmt: 'mjpeg', r: '30' } }
  }
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
  mainWindow.on('closed', onClose)
}

function main (appInstance: App): void {
  application = appInstance
  application.on('window-all-closed', onWindowAllClosed)
  application.on('ready', onReady)
}

ipcMain.on('start-record', (event) => {
  ffmpegInstance.outputs = {
    url: path.join(pathUSB, 'videos', `${Date.now()}.mp4`),
    options: {
      'c:v': 'libx264',
      'c:a': 'aac'
    }
  }
  ffmpegInstance.run()
})

ipcMain.on('stop-record', (event) => {
  ffmpegInstance.kill()
})

ipcMain.on('get-drive', (event) => {
  void getDrives().then((drives) => {
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
