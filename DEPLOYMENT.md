# 🚀 Deployment Guide (Hackathon Edition)

To ensure your UniScript backend deploys without errors during the hackathon, we recommend using **Render** or **Railway** as they are easy to set up and support Node.js/Docker out of the box.

## Option 1: Deploy to Render (Easiest)

1.  Push your code to GitHub.
2.  Go to [dashboard.render.com](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Important Settings:**
    *   **Root Directory:** `backend` (Since we are in a monorepo).
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
    *   **Environment Variables:** Add these from your `.env` file:
        *   `SUPABASE_URL`: (Your Supabase URL)
        *   `SUPABASE_KEY`: (Your Key)
        *   `LINGO_API_KEY`: (Your Lingo Key)
        *   `NODE_VERSION`: `20`
6.  Click **Create Web Service**.

## Option 2: Deploy using Docker (Most Robust)

If you face any issues with libraries (like ffmpeg), Docker is the safest bet.

1.  On Render/Railway, choose **"Deploy from Docker"**.
2.  Point it to the `backend/Dockerfile` (if the platform asks for context, set it to `backend`).

## ⚠️ Important Hackathon Tips

*   **Cold Starts:** Free tier servers "sleep" after inactivity. Access your URL once before your demo starts to wake it up!
*   **Database:** Ensure your Supabase database has "Allow All" IP access (0.0.0.0/0), which is the default, so the cloud server can reach it.
*   **Video Size:** Remember the 1GB limit applies to your server's disk space too. Free tiers are small, so clean up often or restart the deployment to wipe temp files.
