# Deployment Guide for FasalSevaAI

This guide provides the prerequisites and step-by-step instructions to deploy the FasalSevaAI **Frontend** on Vercel and **Backend** on Render.

---

## 1. Backend Deployment (Render)

We deploy the backend first so that we can obtain the live API URL to configure the frontend.

### Prerequisites
- A [Render](https://render.com/) account.
- Your GitHub account linked to Render.
- All your backend environment variables from your local `backend/.env` file.

### Steps to Deploy
1. **Log in to Render** and click on **New +** -> **Web Service**.
2. **Connect your GitHub repository** (`FasalSevaAI`).
3. Set the **Root Directory** to `backend`. (This tells Render where your Python code lives).
4. Configure the following settings for the Web Service:
   - **Name**: `fasalseva-api` (or your preferred name)
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**:
   Scroll down to the Environment Variables section and add all keys from your `.env` file. Specifically:
   - `DATABASE_URL`
   - `SMS_ENABLED` (e.g., `true`)
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (Make sure to replace literal `\n` with actual line breaks if Render requires it, or just paste the raw string)
   - `LOG_LEVEL` (`INFO`)
   - `GROQ_API_KEY`
   - `DATAGOV_API_KEY`
   - `JWT_SECRET`
   - `JWT_ALGORITHM`
   - `OTP_EXPIRY_MINUTES`
6. Click **Create Web Service**. 
7. Once the deployment finishes, copy the live backend URL (e.g., `https://fasalseva-api.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Now that the backend is live, we can deploy the React/Vite frontend.

### Prerequisites
- A [Vercel](https://vercel.com/) account.
- Your GitHub account linked to Vercel.
- The live backend URL you just obtained from Render.

### Steps to Deploy
1. **Log in to Vercel** and click **Add New...** -> **Project**.
2. **Import your GitHub repository** (`FasalSevaAI`).
3. Set the **Root Directory** to `frontend`.
4. The Framework Preset should automatically detect **Vite**. Confirm the build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. **Add Environment Variables**:
   Expand the "Environment Variables" section and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `[YOUR_RENDER_BACKEND_URL]` (e.g., `https://fasalseva-api.onrender.com`)
6. Click **Deploy**.
7. Vercel will build the frontend and give you a live `.vercel.app` domain!

---

## Post-Deployment Checklist
- [ ] Visit your Vercel URL and ensure the UI loads successfully.
- [ ] Try creating an account or logging in to ensure the Vercel frontend is successfully communicating with the Render backend.
- [ ] Ensure any CORS settings in `backend/main.py` allow requests from your new Vercel domain. (If `allow_origins` is restricted, you will need to add your Vercel URL to the list in `main.py` and push to GitHub to trigger a Render redeploy).
