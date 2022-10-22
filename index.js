import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import mongoose from 'mongoose'
import userRoutes from "./routes/user.js"
import MessageModel from './models/message.js'
import UserModel from "./models/user.js"

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(morgan('dev'))


mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true, minPoolSize: 50 });
mongoose.connection
    .once('open', () => { console.log("connection open"); })
    .on('error', err => {
        console.log(err);
        console.log('DB is not connected');
        throw err;
    })

app.use('/api/v1/users', userRoutes)

import http from "http"
const server = http.createServer(app)
import { Server } from 'socket.io';
const io = new Server(server, { cors: { origin: '*' } });

app.get('/rooms', (req, res) => {
    res.json(rooms)
})

async function getLastMessagesFromRoom(room) {
    let lasrMessages = await MessageModel.aggregate([{
            $match: {
                to: room
            }
        },
        {
            $group: {
                _id: '$date',
                messageByDate: { $push: '$$ROOT' }
            }
        }
    ])
    return lasrMessages
}

function sortRoomMessagesyDate(messages) {
    return messages.sort(function(a, b) {
        let date1 = a._id.split('/')
        let date2 = b._id.split('/')

        date1 = date1[2] + date1[0] + date1[1]
        date2 = date2[2] + date2[0] + date2[1]

        return date1 < date2 ? -1 : 1
    })
}

io.on('connection', socket => {

    socket.on('new-user', async() => {
        const members = await UserModel.find()
        io.emit("new-user", members)
    })

    socket.on('join-room', async(newRoom, preRoom) => {
        socket.join(newRoom)
        socket.leave(preRoom)
        let roomMessages = await getLastMessagesFromRoom(room)
        roomMessages = sortRoomMessagesyDate(roomMessages)

        socket.emit('room-messages', roomMessages)
    })

    socket.on('message-room', async(room, content, sender, time, date) => {
        const newMessage = await MessageModel.create({
            content,
            from: sender,
            time,
            date,
            to: room
        })

        let newMessages = await getLastMessagesFromRoom(room)
        newMessages = sortRoomMessagesyDate(roomMessages)

        // sending messages to room
        io.to(room).emit('room-message', roomMessages)

        socket.broadcast.emit('notifications', room)
    })

    app.delete('/logout', async(req, res) => {
        try {
            const { _id, newMessages } = req.body
            const user = await UserModel.find(_id)
            user.status = 'online'
            await user.save()
            const members = await UserModel.find()
            socket.broadcast.emit("new-user", members)
            res.status(200).send()
        } catch (err) {
            res.status(500).json(err)
        }
    })
})

app.use((err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || "Internal server error"
    const stack = process.env.NODE_ENV === "dev" ? err.stack : null

    res.status(status).json({
        message,
        stack
    })
})

const port = process.env.PORT || 3006
server.listen(port, () => {
    console.log(`app is running on port ${port}`)
})