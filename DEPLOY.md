# Planet Mall — Deployment Guide

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Planet Mall — initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/planet-mall.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Framework: Next.js (auto-detected)
4. Add all environment variables from .env.local
5. Click Deploy

### 3. Environment Variables to add in Vercel
Copy ALL variables from .env.local into Vercel's dashboard:
- NEXT_PUBLIC_FIREBASE_* (all Firebase vars)
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_AGORA_APP_ID
- AGORA_APP_CERTIFICATE
- FIREBASE_ADMIN_PROJECT_ID
- FIREBASE_ADMIN_CLIENT_EMAIL
- FIREBASE_ADMIN_PRIVATE_KEY
- NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app

### 4. After deploy — update these:
- Firebase Console → Authentication → Authorized domains → add your Vercel domain
- Stripe Dashboard → Webhooks → add: https://your-domain.vercel.app/api/stripe/webhook
- Update NEXT_PUBLIC_APP_URL in Vercel env vars

### 5. Firebase Admin Key
The private key in .env.local has literal \n — Vercel needs them as actual newlines.
In Vercel dashboard, paste the private key with real line breaks (not \n).

### Deploy command (Vercel CLI)
```bash
npx vercel --prod
```
