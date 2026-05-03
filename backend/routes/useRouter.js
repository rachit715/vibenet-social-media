import express from 'express'
import { login, me, register, searchUsers, getUserProfile, followUser, unfollowUser, updateProfile, deleteAccount } from '../controllers/userController.js'
import protect from '../middlewares/auth.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()
userRouter.post('/register', upload.single('avatar'), register)
userRouter.post('/login', login)
userRouter.get('/me', protect, me)
userRouter.get('/search', searchUsers)
userRouter.get('/profile/:userId', getUserProfile)
userRouter.post('/follow/:userId', protect, followUser)
userRouter.post('/unfollow/:userId', protect, unfollowUser)
userRouter.put('/update', protect, upload.single('avatar'), updateProfile)
userRouter.delete('/delete', protect, deleteAccount)

export default userRouter
