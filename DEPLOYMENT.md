# Deployment Guide — InterviewIQ on Render

This guide walks you through deploying the InterviewIQ full-stack application to Render as two separate services: a Node.js Web Service (backend) and a Static Site (frontend).

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─── HTTPS ───────────────────────────┐
                 │                                      │
                 ▼                                      ▼
    ┌────────────────────────┐           ┌─────────────────────────┐
    │  Render Static Site    │           │  Render Web Service     │
    │  (interviewiq-client)  │◄─────────►│  (interviewiq-server)   │
    │                        │   CORS    │                         │
    │  - Vite Build (React)  │  Allowed  │  - Express + Node.js    │
    │  - Served from /dist   │           │  - Port 10000           │
    │  - CDN cached          │           │  - JWT cookies          │
    └────────────────────────┘           └────────┬────────────────┘
                                                   │
                        ┌──────────────────────────┼──────────────────┐
                        │                          │                  │
                        ▼                          ▼                  ▼
              ┌──────────────────┐    ┌────────────────────┐  ┌──────────────┐
              │  MongoDB Atlas   │    │    Cloudinary      │  │  Google AI   │
              │  (Database)      │    │  (File Storage)    │  │  (Gemini)    │
              └──────────────────┘    └────────────────────┘  └──────────────┘
```

**Services**:
1. **interviewiq-server** (Web Service) — Node.js backend handling auth, resume processing, interview logic
2. **interviewiq-client** (Static Site) — React SPA served via CDN

**External Dependencies**:
- **MongoDB Atlas** — Database (free tier available)
- **Cloudinary** — Resume file storage (free tier: 25 GB, 25 credits/month)
- **Google AI (Gemini)** — AI-powered resume analysis and interview questions

---

## 2. Prerequisites Checklist

Before deploying, ensure you have:

- [ ] **GitHub/GitLab repository** — Code pushed to a remote repo (Render connects to it)
- [ ] **MongoDB Atlas cluster** — Free tier cluster created, connection string ready
- [ ] **Cloudinary account** — Cloud name, API key, and API secret ready
- [ ] **Google AI (Gemini) API key** — Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] **Render account** — Sign up at [render.com](https://render.com) (free tier available)

---

## 3. Step-by-Step Render Deployment

### Step 3.1: Deploy the Backend (Web Service)

#### a) Create the Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub/GitLab repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `interviewiq-server` (or your choice) |
| **Environment** | `Node` |
| **Region** | Choose the region closest to your users |
| **Branch** | `main` (or your deployment branch) |
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

5. Click **Advanced** and set **Health Check Path** to `/api/health`

#### b) Set Environment Variables

In the **Environment** section, add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required for secure cookies and production logging |
| `PORT` | `10000` | Render auto-injects this, but document it |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/interviewiq` | Replace with your MongoDB Atlas connection string |
| `JWT_SECRET` | Generate via `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` | 64+ character random string |
| `JWT_EXPIRES_IN` | `7d` | JWT expiration period |
| `CLIENT_URL` | `https://PLACEHOLDER` | **Update after creating Static Site** (Step 3.2) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard | See Section 6 |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard | See Section 6 |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard | See Section 6 |
| `GEMINI_API_KEY` | From Google AI Studio | See Section 7 |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Model version |

6. Click **Create Web Service**
7. Wait for deployment to complete (monitor logs for errors)
8. **Copy the Web Service URL** (e.g., `https://interviewiq-server.onrender.com`) — you'll need it in Step 3.2

#### c) Verify Server Health

Visit `https://<your-server-name>.onrender.com/api/health` in your browser.

**Expected response**:
```json
{
  "success": true,
  "message": "Server is running"
}
```

If you see this, the server is live and ready!

---

### Step 3.2: Deploy the Frontend (Static Site)

#### a) Create the Static Site

1. In Render Dashboard, click **New** → **Static Site**
2. Connect the **same repository**
3. Configure the site:

| Setting | Value |
|---------|-------|
| **Name** | `interviewiq-client` (or your choice) |
| **Branch** | `main` |
| **Root Directory** | `client` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

#### b) Set Environment Variable

In the **Environment** section, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://<your-server-name>.onrender.com/api` | Use the Web Service URL from Step 3.1c |

**Example**: If your server is at `https://interviewiq-server.onrender.com`, set:
```
VITE_API_URL=https://interviewiq-server.onrender.com/api
```

4. Click **Create Static Site**
5. Wait for build to complete (Vite will bundle the React app)
6. **Copy the Static Site URL** (e.g., `https://interviewiq-client.onrender.com`)

---

### Step 3.3: Update Server CORS Configuration

Now that the client is deployed, update the server's `CLIENT_URL` to allow CORS:

1. Go back to **Web Service** (`interviewiq-server`)
2. Navigate to **Environment** tab
3. Update `CLIENT_URL` to your Static Site URL:
   ```
   CLIENT_URL=https://interviewiq-client.onrender.com
   ```
   **Important**: No trailing slash, must match exactly

4. Click **Save Changes** — this will trigger a server redeploy
5. Wait for redeploy to complete

---

## 4. Environment Variables Reference

### Server (Web Service)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (enables HTTPS-only cookies) | `production` |
| `PORT` | HTTP port (Render auto-assigns 10000) | `10000` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing JWT tokens | 64-char random hex string |
| `JWT_EXPIRES_IN` | JWT token lifespan | `7d` |
| `CLIENT_URL` | CORS allowed origin (must match Static Site URL exactly) | `https://interviewiq-client.onrender.com` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | `dxxxxx` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef123456` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model version | `gemini-1.5-flash` |

### Client (Static Site)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://interviewiq-server.onrender.com/api` |

---

## 5. MongoDB Atlas Setup

### a) Create a Free Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / log in
3. Create a new **M0 Free** cluster
4. Choose a cloud provider and region (preferably same as Render region)
5. Wait for cluster provisioning (~3 minutes)

### b) Whitelist IP Addresses

1. In Atlas, go to **Network Access**
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** (`0.0.0.0/0`)
   - This is safe because authentication is required via username/password in the connection string
4. Confirm

### c) Create Database User

1. Go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Set username and **generate a strong password**
5. Set **Built-in Role** to `Read and write to any database`
6. Click **Add User**

### d) Get Connection String

1. Go to **Database** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Select **Driver**: Node.js, **Version**: 5.5 or later
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials
6. Add database name after `.net/`: 
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/interviewiq?retryWrites=true&w=majority
   ```
7. Use this as your `MONGO_URI` in Render

---

## 6. Cloudinary Setup

Cloudinary is used to store uploaded resume files (PDF, DOCX).

1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account
2. After logging in, go to **Dashboard**
3. Copy these three values:

| Field | Location on Dashboard | Environment Variable |
|-------|----------------------|---------------------|
| **Cloud Name** | Top of dashboard, below your account name | `CLOUDINARY_CLOUD_NAME` |
| **API Key** | Below Cloud Name | `CLOUDINARY_API_KEY` |
| **API Secret** | Click "👁️ View API Keys" to reveal | `CLOUDINARY_API_SECRET` |

4. Add these to your Render Web Service environment variables

---

## 7. Google AI (Gemini) Setup

Gemini powers resume analysis and interview question generation.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API Key** → **Create API key**
4. Choose a Google Cloud project (or create a new one)
5. Copy the generated API key (starts with `AIzaSy...`)
6. Add it as `GEMINI_API_KEY` in Render Web Service environment variables

**Rate Limits (Free Tier)**:
- 15 requests per minute
- 1500 requests per day
- 1 million tokens per day

For production, consider upgrading to Gemini API Pro.

---

## 8. Post-Deployment Verification

### a) Test Server Health Endpoint

Visit: `https://<your-server>.onrender.com/api/health`

**Expected**: 
```json
{"success": true, "message": "Server is running"}
```

### b) Test Client Load

Visit: `https://<your-client>.onrender.com`

**Expected**: Landing page loads, no console errors

### c) Test User Registration and Login

1. Click **Sign Up**
2. Create a new account
3. Verify redirect to dashboard
4. Log out
5. Log back in with the same credentials
6. Verify JWT cookie is set (check Application → Cookies in DevTools)

### d) Test Resume Upload

1. Go to **Resumes** page
2. Upload a PDF or DOCX file
3. Verify file appears in the list
4. Click **Analyze** (or if auto-analysis is enabled, check that analysis appears)
5. Check Cloudinary Dashboard → verify asset was uploaded

### e) Test Interview Creation

1. Go to **Interviews** page
2. Create a new interview (choose type, number of questions)
3. Click **Start Interview**
4. Verify questions are generated (powered by Gemini)
5. Answer a question
6. Verify autosave works (check Network tab for PATCH requests)
7. Complete the interview
8. Verify summary page loads

### f) Check Browser Console

Open DevTools → Console. You should see **no errors**.

**Common issues**:
- **CORS error**: `CLIENT_URL` mismatch (see Section 9a)
- **Cookie not set**: `NODE_ENV` not set to `production` (see Section 9c)
- **Network error**: Server is down or still cold-starting (free tier limitation)

---

## 9. Troubleshooting

### a) CORS Errors in Browser Console

**Symptom**: 
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Causes**:
1. `CLIENT_URL` in server env vars does not match Static Site URL
2. Trailing slash mismatch (e.g., `https://app.com/` vs `https://app.com`)
3. HTTP vs HTTPS mismatch

**Fix**:
1. Go to Render Web Service → Environment
2. Verify `CLIENT_URL` **exactly** matches Static Site URL (no trailing slash)
3. Example: `CLIENT_URL=https://interviewiq-client.onrender.com`
4. Save → wait for server redeploy
5. Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)

---

### b) MongoDB Connection Failed

**Symptom**: Server logs show `MongoNetworkError` or `Authentication failed`

**Causes**:
1. IP not whitelisted in MongoDB Atlas
2. Incorrect username/password in `MONGO_URI`
3. Missing database name in connection string

**Fix**:
1. Go to MongoDB Atlas → **Network Access** → Add `0.0.0.0/0`
2. Verify `MONGO_URI` format:
   ```
   mongodb+srv://<user>:<pass>@cluster.mongodb.net/interviewiq?retryWrites=true&w=majority
   ```
3. Test connection locally first (set `MONGO_URI` in server `.env` and run `npm start`)

---

### c) JWT Cookie Not Being Set

**Symptom**: Login succeeds but user is immediately logged out, or `req.user` is undefined

**Causes**:
1. `NODE_ENV` is not set to `production` (cookie `secure` flag requires HTTPS)
2. Browser blocking third-party cookies (should not apply here since same-site)

**Fix**:
1. Go to Render Web Service → Environment
2. Verify `NODE_ENV=production` is set
3. Save → redeploy
4. Clear browser cookies and try again

---

### d) Render Free Tier Cold Starts

**Symptom**: First request after 15 minutes of inactivity takes 30-60 seconds

**Cause**: Render free tier spins down Web Services after 15 minutes of inactivity

**Solutions**:
1. **Upgrade to paid plan** ($7/month) to eliminate cold starts
2. **Use an uptime monitor** (e.g., UptimeRobot) to ping `/api/health` every 10 minutes (keeps service warm)
3. **Accept the limitation** for low-traffic apps (Static Site is always fast, only server has cold starts)

---

### e) Build Failures

**Symptom**: Render build logs show `npm install` errors or `vite build` failures

**Common causes**:
- **Node version mismatch**: Render defaults to Node 14. Add `"engines": {"node": ">=20"}` to `package.json`
- **Missing dependencies**: Run `npm install` locally first to verify `package-lock.json` is up to date
- **Environment variable missing at build time**: Vite requires `VITE_API_URL` to be set **before** build

**Fix**:
1. Add to `server/package.json` and `client/package.json`:
   ```json
   "engines": {
     "node": ">=20.0.0"
   }
   ```
2. Commit and push
3. Trigger manual redeploy in Render

---

### f) Gemini API Quota Exceeded

**Symptom**: Interview questions fail to generate, server logs show `429 Too Many Requests`

**Cause**: Free tier limit is 15 requests/minute

**Fix**:
1. Implement client-side rate limiting (disable "Generate Questions" button for 5 seconds after each request)
2. Upgrade to Gemini API Pro with billing enabled
3. Reduce number of questions per interview

---

### g) Cloudinary Upload Fails

**Symptom**: Resume upload fails with `Invalid API credentials`

**Cause**: Incorrect `CLOUDINARY_API_KEY` or `CLOUDINARY_API_SECRET`

**Fix**:
1. Go to Cloudinary Dashboard → Account Details
2. Click "👁️ View API Keys" to reveal API Secret
3. Copy **Cloud Name**, **API Key**, and **API Secret** exactly
4. Update in Render Web Service → Environment
5. Save → redeploy

---

## 10. Redeployment and Updates

### Auto-Deploy on Git Push

By default, Render auto-deploys when you push to the connected branch.

**To disable auto-deploy**:
1. Go to service settings
2. Toggle off **Auto-Deploy**

### Manual Deploy

To manually trigger a deploy without pushing code:
1. Go to Render Dashboard → Select your service
2. Click **Manual Deploy** → Choose branch
3. Click **Deploy**

### Environment Variable Changes

Changing environment variables **always triggers a redeploy**. The service will restart with the new values.

### Database Migrations

This project uses Mongoose (MongoDB ODM) with schema-based models. No manual migrations are needed.

**When adding new fields to models**:
1. Update the Mongoose schema in `server/src/models/`
2. Commit and push
3. Render auto-deploys
4. Existing documents will not have the new field (Mongoose handles this gracefully with defaults)

---

## 11. Production Checklist

After deployment, verify:

- [ ] Server health endpoint returns 200 OK
- [ ] Client loads without console errors
- [ ] User registration and login work
- [ ] JWT cookies are set (check DevTools → Application → Cookies)
- [ ] Resume upload and Cloudinary storage work
- [ ] Gemini API calls succeed (resume analysis, interview questions)
- [ ] MongoDB connection is stable (check server logs)
- [ ] CORS is configured correctly (no CORS errors in console)
- [ ] Rate limiting is active (verify by making 100 requests in 15 minutes)
- [ ] All environment variables are set correctly
- [ ] No secrets are committed to git (run `git log --all -S 'MONGO_URI'` to verify)

---

## 12. Scaling and Performance

### Free Tier Limitations

| Resource | Limit | Impact |
|----------|-------|--------|
| **Web Service Cold Start** | Spins down after 15 min | First request takes 30-60s |
| **Bandwidth** | 100 GB/month (shared) | May be exceeded with file uploads |
| **Build Minutes** | 500 min/month | Each deploy ~2-3 min |
| **Static Site** | No cold starts | Always fast (served via CDN) |

### When to Upgrade

Consider upgrading to paid plans ($7/month for Web Service, $1/month for database) if:
- You have regular users (to eliminate cold starts)
- Bandwidth exceeds 100 GB/month
- You need custom domains or team collaboration features

### Performance Optimization

1. **Enable Compression**: Already enabled via Helmet
2. **Optimize MongoDB Queries**: Indexes are defined in models (e.g., `email` on User model)
3. **Cache Static Assets**: Already configured in `render.yaml` (1-year cache for `/assets/*`)
4. **Use CDN for Images**: Cloudinary serves images via CDN by default
5. **Monitor Performance**: Use Render's built-in metrics or add external monitoring (New Relic, Datadog)

---

## 13. Custom Domain (Optional)

To use your own domain (e.g., `app.interviewiq.com`):

### For Static Site (Client)

1. Go to Render Static Site → Settings → Custom Domains
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `app.interviewiq.com`)
4. Render provides CNAME or A record values
5. Add these records to your DNS provider (e.g., Cloudflare, Namecheap)
6. Wait for DNS propagation (~10-60 minutes)
7. Render automatically provisions SSL certificate

### For Web Service (Server)

1. Go to Render Web Service → Settings → Custom Domains
2. Follow the same process (e.g., `api.interviewiq.com`)

### Update Environment Variables

After adding custom domains:
1. Update `CLIENT_URL` in server env vars to `https://app.interviewiq.com`
2. Update `VITE_API_URL` in client env vars to `https://api.interviewiq.com/api`
3. Both services will auto-redeploy

---

## 14. Security Best Practices

✅ **Already Implemented**:
- Helmet.js for security headers
- CORS whitelist (only specified client allowed)
- httpOnly cookies (prevent XSS)
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation via express-validator
- Bcrypt for password hashing
- JWT expiration (7 days)
- MongoDB connection with authentication

🔒 **Additional Recommendations**:
1. **Enable 2FA** on all external services (MongoDB Atlas, Cloudinary, Google Cloud)
2. **Rotate secrets regularly** (JWT_SECRET, API keys)
3. **Monitor logs** for suspicious activity
4. **Use Render's private networking** (if on paid plan) to isolate backend from public internet
5. **Set up alerts** for failed login attempts or API quota nearing limits

---

## 15. Support and Resources

**Render Documentation**:
- [Web Services](https://render.com/docs/web-services)
- [Static Sites](https://render.com/docs/static-sites)
- [Environment Variables](https://render.com/docs/environment-variables)

**MongoDB Atlas**:
- [Getting Started](https://docs.atlas.mongodb.com/getting-started/)
- [Connection Strings](https://docs.atlas.mongodb.com/driver-connection/)

**Cloudinary**:
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)

**Google Gemini**:
- [API Docs](https://ai.google.dev/docs)

**Render Community**:
- [Discord](https://render.com/community)
- [Forum](https://community.render.com/)

---

## Summary

You've successfully deployed InterviewIQ to Render! 🎉

**Live URLs**:
- **Client**: `https://<your-client-name>.onrender.com`
- **Server**: `https://<your-server-name>.onrender.com`
- **Health Check**: `https://<your-server-name>.onrender.com/api/health`

**Next Steps**:
1. Test all features end-to-end
2. Monitor server logs for errors
3. Set up uptime monitoring (optional)
4. Consider upgrading to paid plan for better performance
5. Add custom domain (optional)

For issues, check the Troubleshooting section (Section 9) or reach out to Render support.

Happy interviewing! 🚀
