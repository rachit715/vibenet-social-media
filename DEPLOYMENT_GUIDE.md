# 🚀 Deployment Guide

## What I Changed For You

### 1. **Backend Configuration** (`backend/.env`)

- ✅ Enabled MongoDB Atlas cloud connection (commented one is now active)
- ✅ Removed quotes from environment variables
- ✅ Added placeholder for strong JWT_SECRET (needs to be changed in Render)

### 2. **Frontend Configuration** (`frontend/.env.production`)

- ✅ Created production environment file with `VITE_API_URL` placeholder
- ✅ Frontend already uses `import.meta.env.VITE_API_URL` correctly

### 3. **Git Ignore Files**

- ✅ Updated `frontend/.gitignore` to exclude `.env` files
- ✅ Created root `.gitignore` to prevent sensitive data from being pushed

### 4. **Deployment Configuration Files**

- ✅ Created `render.yaml` for Render backend deployment setup
- ✅ Created `frontend/vercel.json` for Vercel frontend deployment
- ✅ Created `.env.example` files showing required variables

---

## 📋 Step-by-Step Deployment Instructions

### **STEP 1: Push to GitHub**

```bash
git add .
git commit -m "Setup for production deployment"
git push origin main
```

Make sure your `.env` files are NOT committed (they should be ignored).

---

### **STEP 2: Deploy Backend to Render** 🖥️

1. **Go to [render.com](https://render.com)** → Sign up with GitHub

2. **Create New Service:**
   - Click "New+" → "Web Service"
   - Select your GitHub repo
   - Choose `backend` folder as root directory
   - Set **Start Command:** `npm start`
   - Set **Build Command:** `npm install`

3. **Add Environment Variables in Render Dashboard:**
   - Go to Service Settings → Environment
   - Add these variables:
     ```
     PORT=4000
     MONGODB_URI=mongodb://rachit3076_db_user:RjgeiDOmJDv7Qrww@ac-gvqmlxl-shard-00-00.eekllhf.mongodb.net:27017,ac-gvqmlxl-shard-00-01.eekllhf.mongodb.net:27017,ac-gvqmlxl-shard-00-02.eekllhf.mongodb.net:27017/?ssl=true&replicaSet=atlas-a6hghg-shard-0&authSource=admin&appName=Cluster0
     JWT_SECRET=your_super_secret_long_random_string_here_minimum_32_chars
     CLOUDINARY_NAME=dhvkzsrng
     CLOUDINARY_API_KEY=919661416146751
     CLOUDINARY_SECRET_KEY=kDrrJ5MHV20caVIj0UOhQxD7cFc
     ```

4. **Deploy** → Copy your backend URL (looks like: `https://your-app.onrender.com`)

---

### **STEP 3: Deploy Frontend to Vercel** 🎨

1. **Go to [vercel.com](https://vercel.com)** → Sign up with GitHub

2. **Create New Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repo
   - Choose `frontend` folder as root directory
   - Framework: Vite (should auto-detect)

3. **Add Environment Variables:**
   - Set this in Vercel Dashboard:
     ```
     VITE_API_URL=https://your-render-backend-url.onrender.com
     ```
   - Replace `your-render-backend-url` with your actual Render URL from STEP 2

4. **Deploy** → Get your frontend URL (looks like: `https://your-project.vercel.app`)

---

### **STEP 4: Update Frontend for Production**

After Render gives you the backend URL, update in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Change `VITE_API_URL` to your actual Render backend URL
3. Click "Redeploy" to rebuild with new URL

---

## 🔐 Security Checklist

- ❌ **NEVER commit** `.env` files (they're gitignored now)
- ✅ **Change JWT_SECRET** in Render to something STRONG (not 'rachit')
- ✅ **Verify MongoDB Atlas connection** works
- ✅ **Cloudinary credentials** are secure in Render environment

---

## 🧪 Testing After Deployment

1. Go to your Vercel frontend URL
2. Try to register/login - should connect to Render backend
3. Check browser console for any CORS errors
4. Verify posts, images, and stories load correctly

---

## 📞 Troubleshooting

| Issue                           | Solution                                                      |
| ------------------------------- | ------------------------------------------------------------- |
| 404 Frontend routes not working | Already fixed with `vercel.json` rewrites                     |
| CORS errors                     | Backend CORS is enabled, check Render backend URL in frontend |
| API calls failing               | Verify `VITE_API_URL` is set correctly in Vercel              |
| MongoDB connection failed       | Check MongoDB Atlas credentials in Render env vars            |
| Images not loading              | Ensure Cloudinary credentials are correct in Render           |

---

## 📁 Summary of Created/Updated Files

✅ `backend/.env` - Updated with MongoDB Atlas & production config
✅ `frontend/.env.production` - Created for production deployment
✅ `frontend/.gitignore` - Updated to exclude .env files  
✅ `root/.gitignore` - Created to exclude backend .env
✅ `render.yaml` - Configuration for Render deployment
✅ `frontend/vercel.json` - Configuration for Vercel deployment
✅ `backend/.env.example` - Example env variables
✅ `frontend/.env.example` - Example env variables

---

**Ready?** Start with STEP 1 - push to GitHub! 🚀
