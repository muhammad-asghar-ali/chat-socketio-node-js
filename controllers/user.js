import UserModel from "../models/user.js"
import { createError } from "../error.js"

export const register = async(req, res, next) => {
    try {
        const data = req.body

        if (!data.name || !data.email || !data.password) {
            return next(createError(400, "name or email or password is missing"))
        }

        const user = await UserModel.create(data)
        res.status(201).json(user)
    } catch (err) {
        let msg
        if (err.code === 1100) {
            msg = "User already exist"
        } else {
            msg = err.message
        }
        res.status(500).json({ error: msg })
    }
}

export const login = async(req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return next(createError(400, "email or password is missing"))
        }

        const user = await UserModel.findByCredentials(email, password)
        if (!user) {
            return next(createError(404, "user not found"))
        }

        user.status = 'online'
        await UserModel.save()
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}