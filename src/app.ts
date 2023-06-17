import express from 'express'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import { Gpio } from 'onoff'
const app = express()
const server = http.createServer(app)
const port = 3000
const io = new Server(server)
const button = new Gpio(4, 'in', 'both')

app.use(express.static(path.resolve(__dirname, './client')))

io.on('connection', (socket) => {
  console.log('a user connected')
})

button.watch((err, value) => {
  if (err != null) {
    throw err
  }

  io.emit('chat message', 'test')
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client', 'index.html'))
})

app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`)
})

process.on('SIGINT', _ => {
  button.unexport()
})
