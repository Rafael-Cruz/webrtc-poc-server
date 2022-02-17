const http = require('http')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const { Server } = require("socket.io");

const PORT = process.env.WEBRTC_POC_SERVER__PORT
const ORIGIN = process.env.WEBRTC_POC_SERVER__ORIGIN

if (!PORT) {
  throw new Error('variable WEBRTC_POC_SERVER__PORT must be set')
}

if (!ORIGIN) {
  throw new Error('variable WEBRTC_POC_SERVER__ORIGIN must be set')
}

const app = express()

app.use(cors())

app.get('/', (_, res) => {
  res.json({ foo: 'bar' })
})

const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEBRTC_POC_SERVER__ORIGIN,
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  console.log('\na user connected\n', socket.id)

  socket.on("create or join", (roomName) => {
    const rooms = io.of("/").adapter.rooms;
    const isExistingRoom = rooms.has(roomName)

    if (!isExistingRoom) {
      console.log(roomName, 'room is being created')

      socket.join(roomName)
      socket.emit("created", roomName)
      console.log(socket.id, 'created room', roomName)
    } else {
      console.log(roomName, 'was an existing room')

      const room = rooms.get(roomName)
      const isFull = room.size > 1

      if (isFull) {
        socket.emit('full room', roomName)
        console.log(socket.id, 'tried to enter full room', roomName)
      } else {
        socket.join(roomName)
        socket.emit("joined", roomName)
        console.log(socket.id, 'joined room', roomName)
      }
    }

    const room = rooms.get(roomName)
    const isFull = room.size > 1

    console.log('after join', { room })

    if (isFull) {
      io.in(roomName).emit("ready")
    }
  })

  socket.on('offer', ({ roomName, sdp }) => {
    console.log('received offer', { roomName })
    socket.to(roomName).emit('offer', sdp)
  })
  
  socket.on('answer', ({ roomName, sdp }) => {
    console.log('received answer', { roomName })
    socket.to(roomName).emit('answer', sdp)
  })

  socket.on('candidate', ({
    roomName,
    sdpMLineIndex,
    sdpMid,
    usernameFragment,
    candidate
  }) => {
    console.log('received candidate', { 
      roomName,
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      candidate
    })
    socket.to(roomName).emit('candidate', {
      sdpMLineIndex,
      sdpMid,
      usernameFragment,
      candidate
    })
  })
})

httpServer.listen(PORT, () => {
  console.log('Ouvindo na porta ' + PORT)
})