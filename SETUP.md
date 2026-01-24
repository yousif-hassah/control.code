# Control App - Setup Guide

## 🚀 Quick Start with Resend

### 1. Get Your Resend API Key

1. Visit [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day)
3. Go to [API Keys](https://resend.com/api-keys)
4. Create a new API key
5. Copy the key (starts with `re_`)

### 2. Configure the App

Open `.env` file and replace `re_YOUR_API_KEY_HERE` with your actual Resend API key:

```env
RESEND_API_KEY=re_abc123xyz...
```

### 3. Run the Application

You need to run TWO terminals:

**Terminal 1 - Frontend (Vite):**

```bash
npm run dev
```

**Terminal 2 - Backend (API Server):**

```bash
npm run server
```

### 4. Access the App

- Frontend: http://localhost:5173
- API Server: http://localhost:3001

## ✨ Features

- ✅ **Unlimited Login Attempts**: 100 emails per day (vs 3/hour with Supabase Auth)
- ✅ **Fast Email Delivery**: Resend is optimized for speed
- ✅ **Beautiful Email Templates**: Professional OTP emails
- ✅ **Supabase Database**: All your data is safely stored
- ✅ **No Annoying Limits**: Simple and straightforward

## 🔧 How It Works

1. User enters email and name
2. App generates 6-digit OTP code
3. Code is sent via Resend API
4. User enters code to verify
5. Profile is created/loaded from Supabase
6. User data is synced to Supabase for persistence

## 📝 Notes

- The free Resend plan gives you 100 emails/day
- Supabase is used ONLY for data storage (not authentication)
- No complex authentication flows - just simple OTP
- All user data persists in Supabase database

## 🆘 Troubleshooting

**Emails not sending?**

- Check your RESEND_API_KEY in `.env`
- Make sure the API server is running (`npm run server`)
- Check the terminal for error messages

**Can't login?**

- Verify both servers are running (frontend + backend)
- Check browser console for errors
- Make sure you're using the correct OTP code

---

Made with ❤️ for simplicity and speed
