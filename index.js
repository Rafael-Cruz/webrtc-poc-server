const http = require('http')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const { Server } = require("socket.io");

const PORT = 8080

const app = express()

app.use(cors())

app.get('/', (_, res) => {
  res.json({ foo: 'bar' })
})

const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  console.log('\na user connected\n')
})

httpServer.listen(PORT, () => {
  console.log('Ouvindo na porta ' + PORT)
})