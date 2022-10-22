import mongoose from "mongoose";
import val from "validator"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        requried: [true, "cannot be blank"]
    },
    email: {
        type: String,
        requried: [true, "cannot be blank"],
        unique: true,
        lowercase: true,
        index: true,
        validator: [val.isEmail, "invalid email"]
    },
    password: {
        type: String,
        requried: [true, "cannot be blank"]
    },
    picture: {
        type: String,
        default: null
    },
    newMessages: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        default: null
    }
}, { timestamps: true, minimize: false })

userSchema.pre("save", function(next) {
    const user = this
    if (!this.isModified('password')) {
        return next()
    }
    bcrypt.genSalt(10, function(err, salt) {
        if (err) return next(err)

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err)

            user.password = hash
            next()
        })
    })

    // if(!this.isModified('password')) {
    //     return next()
    // }

    // const salt = bcrypt.genSaltSync(10);
    // const hashPassword = bcrypt.hashSync(this.password, salt);

    // this.password = hashPassword
    // return next()

})

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    return userObject
}

userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email })
    if (!user) throw new Error("invalid email or password")

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new Error("invalid email or password")

    return user
}

export default mongoose.model("user", userSchema)