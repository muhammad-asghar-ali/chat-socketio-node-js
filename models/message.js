import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    content: {
        type: String
    },
    from: {
        type: Object
    },
    socketid: {
        type: String,
    },
    time: {
        type: String,
    },
    date: {
        type: Object,
    },
    to: {
        type: String,
    }
}, { timestamps: true, minimize: false })

export default mongoose.model('message', messageSchema)