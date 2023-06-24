import { app, BrowserWindow, ipcMain, type App } from 'electron'
import { list as getDrives } from 'drivelist'
import { FFmpeg } from 'kiss-ffmpeg'
// import Recorder from './utils/recorder'
import * as fs from 'fs'
import * as path from 'path'
import { type ChildProcess } from 'child_process'
// const recorder = new Recorder()

const prod = true
let mainWindow: BrowserWindow | null
let application: App
let pathUSB: string = prod ? '' : path.resolve(__dirname, '..')
let pathVideos: string
let config = {
  slideSize: 5,
  random: true,
  usbCopy: false,
  delay: 10
}
let fileName: string
let childProcess: ChildProcess | null

const ffmpegInstance: FFmpeg = new FFmpeg(
  {
    inputs: [
      { url: '/dev/video0', options: { vaapi_device: '/dev/dri/renderD128', f: 'v4l2', video_size: '1920x1080', pix_fmt: 'nv12', framerate: '30' } },
      { url: 'hw:1,0', options: { f: 'alsa' } }
    ]
  }
)

function onWindowAllClosed (): void {
  if (process.platform !== 'darwin') {
    application.quit()
  }
  if (childProcess != null) {
    childProcess.kill('SIGINT')
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
  if (childProcess == null && prod) {
    fileName = `${Date.now()}.mp4`
    ffmpegInstance.outputs = {
      url: path.join(pathVideos, fileName),
      options: {
        vf: 'format=nv12,hwupload',
        'c:v': 'h264_vaapi',
        'b:v': '5M',
        'profile:v': 578,
        'c:a': 'aac'
      }
    }
    childProcess = ffmpegInstance.run()
  }
})

ipcMain.on('stop-record', (event) => {
  if (childProcess != null && prod) {
    childProcess.kill('SIGINT')
    childProcess = null
    if (config.usbCopy) fs.copyFileSync(path.join(pathVideos, fileName), path.join(path.resolve(pathUSB, 'videos'), fileName))
  }
})

ipcMain.on('get-drive', (event) => {
  void getDrives().then((drives) => {
    if (prod) {
      drives.forEach((drive) => {
        if (drive.isUSB ?? false) {
          drive.mountpoints.forEach((mountpoint) => {
            if (mountpoint.label === 'FMJLOCAL') {
              pathVideos = mountpoint.path
            }
            if (mountpoint.label === 'FMJEXTERN') {
              pathUSB = mountpoint.path
            }
          })
        }
      })
    }
    const files = fs.readdirSync(path.resolve(pathUSB, 'slides'))
    const images = files.map(file => path.join(path.resolve(pathUSB, 'slides'), file))
    event.reply('images', images)

    if (fs.existsSync(path.join(pathUSB, 'config.json'))) {
      fs.readFile(path.join(pathUSB, 'config.json'), 'utf8', (_err, c) => {
        config = JSON.parse(c)
        event.reply('config', config)
      })
    }
  })
})

main(app)
