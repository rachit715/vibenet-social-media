# ⚡ DEPLOYMENT - COMPLETE STEP-BY-STEP

## STEP 1: Create GitHub Repo (VSCODE)

1. Open VSCODE Terminal
2. Run:

```
cd "c:\Users\DELL\OneDrive\Desktop\SOCIAL MEDIA"
git init
git add .
git commit -m "Initial commit"
```

3. Go to https://github.com/new
4. Create repo: `social-media` (public)
5. Copy the commands shown, run in VSCODE:

```
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/social-media.git
git push -u origin main
```

---

## STEP 2: Setup MongoDB Atlas (MONGODB ATLAS WEBSITE)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or Login
3. Create Project → "social-media"
4. Create Cluster → Free tier → Oregon region
5. Wait 5-10 minutes for creation
6. **Database Access:**
   - Click "Database Access" (left menu)
   - Add user: `rachit3076_db_user` / Password: `RjgeiDOmJDv7Qrww`
   - Click "Add User"

7. **Network Access:**
   - Click "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

8. **Get Connection String:**
   - Go to "Databases" → Click "Connect"
   - Choose "Drivers"
   - Select "Node.js"
   - Copy connection string (starts with `mongodb+srv://`)
   - Replace `<username>` and `<password>` in the string

**Result:** Your `MONGODB_URI` for backend

---

## STEP 3: Deploy Backend to Render (RENDER WEBSITE)

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Select your GitHub repo
5. Fill in:
   - **Name:** `social-media-backend`
   - **Region:** Oregon
   - **Branch:** main
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)

8. **Add Environment Variables:**
   - Go to Settings → Environment
   - Add these exact variables:

   ```
   PORT = 4000
   MONGODB_URI = [PASTE YOUR MONGODB CONNECTION STRING]
   JWT_SECRET = aB9$kL2@mP7!qR4$sT8#uV1%wX3^yZ5&
   CLOUDINARY_NAME = dhvkzsrng
   CLOUDINARY_API_KEY = 919661416146751
   CLOUDINARY_SECRET_KEY = kDrrJ5MHV20caVIj0UOhQxD7cFc
   ```

9. Click "Save Changes" → Auto-redeploy
10. **Copy your Render URL** (looks like: `https://social-media-backend.onrender.com`)

---

## STEP 4: Deploy Frontend to Vercel (VERCEL WEBSITE)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Select your GitHub repo
5. Fill in:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

6. **Add Environment Variable:**
   - Add new variable:

   ```
   VITE_API_URL = [PASTE YOUR RENDER URL FROM STEP 3]
   ```

7. Click "Deploy"
8. Wait for deployment (2-5 minutes)
9. **Copy your Vercel URL** (looks like: `https://social-media.vercel.app`)

---

## STEP 5: Test Your App

1. Open your **Vercel URL** in browser
2. Register/Login
3. Upload posts with images
4. Check if everything works

---

## IMPORTANT NOTES

⚠️ **If backend goes to sleep:**

- Render free tier sleeps after 15 min inactivity
- Just refresh and wait 30 seconds - it will wake up

⚠️ **If images don't load:**

- Make sure `VITE_API_URL` in Vercel is correct
- Redeploy Vercel if changed

✅ **YOUR LIVE LINKS:**

- Frontend: Your Vercel URL
- Backend: Your Render URL
- Database: MongoDB Atlas (check at cloud.mongodb.com)
