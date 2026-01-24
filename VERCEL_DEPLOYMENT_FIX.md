# 🚀 Vercel Deployment Guide - Fix Blank Page & Enable Email Auth

## Problem: Blank Page on Vercel

**Cause:** Missing environment variables (Supabase credentials)

## Solution:

### Step 1: Add Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click on your project: `control-code-1`
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
Variable Name: VITE_SUPABASE_URL
Value: https://sqhflhwenjxkqwjlfxxi.supabase.co

Variable Name: VITE_SUPABASE_ANON_KEY
Value: [Get this from Supabase Dashboard → Settings → API → anon public key]
(It should start with "eyJ...")

Variable Name: EMAIL_USER
Value: controlcode11@gmail.com

Variable Name: EMAIL_PASS
Value: nkru pzoe osdr iqsz
```

### Step 2: Redeploy

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2 minutes)

---

## How Email Authentication Works on Vercel:

Your `api/send-otp.js` file is a **Vercel Serverless Function**.

- It runs automatically on Vercel's servers
- No need to deploy a separate Node.js server
- It uses the `EMAIL_USER` and `EMAIL_PASS` environment variables you added

---

## Testing:

### Local Testing (localhost):

1. Make sure `node server.js` is running in a terminal
2. Open http://localhost:5173
3. Try to login - email should be sent via your local server

### Production Testing (Vercel):

1. After adding environment variables and redeploying
2. Open https://control-code-1.vercel.app
3. Try to login - email should be sent via Vercel's serverless function

---

## Common Issues:

### Issue: Still getting blank page after adding variables

**Solution:** Make sure you clicked "Redeploy" after adding the variables

### Issue: Email not sending on Vercel

**Solution:**

1. Check that `EMAIL_USER` and `EMAIL_PASS` are correctly added
2. Make sure the Gmail App Password is correct (16 characters)
3. Check Vercel deployment logs for errors

### Issue: "supabaseUrl is required" error

**Solution:**

1. Make sure `VITE_SUPABASE_URL` starts with `https://`
2. Make sure `VITE_SUPABASE_ANON_KEY` is the correct key from Supabase (starts with `eyJ`)

---

## Need Help?

If you see any errors in the Vercel deployment logs, copy them and I can help debug!
