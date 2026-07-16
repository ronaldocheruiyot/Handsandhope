# 🚀 Vercel Environment Variables Setup Guide

## Quick Setup for Buyers2 & Sellers2

### Step 1: Go to Vercel Project Settings

For **Buyers2** (https://handsandhope-one.vercel.app/):
1. Log in to https://vercel.com
2. Go to "Buyers2" project (or search for it)
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** (left sidebar)

For **Sellers2** (https://handsandhope-sellers.vercel.app/):
1. Log in to https://vercel.com
2. Go to "Sellers2" project (or search for it)
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** (left sidebar)

---

### Step 2: Add the Environment Variable

**For BOTH projects, add this variable:**

| Field | Value |
|-------|-------|
| **Name** | `VITE_API_URL` |
| **Value** | `https://handsandhope-31gp.onrender.com` |

---

### Step 3: Select Environments

Check all three environments:
- ✅ Production
- ✅ Preview
- ✅ Development

---

### Step 4: Save and Redeploy

1. Click **Save** button
2. Vercel will show a banner: "You need to redeploy for the changes to take effect"
3. Click **Redeploy** or go to **Deployments** and trigger a new deploy
4. Wait for deployment to complete (usually 1-2 minutes)

---

## ✅ Verify It's Working

### Test API Connection:

After deployment is complete, open browser console (F12) and run:

**For Buyers App:**
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
fetch('https://handsandhope-31gp.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Success! Products:', d))
  .catch(e => console.error('❌ Error:', e))
```

**For Sellers App:**
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
// Test with your JWT token if logged in
const token = localStorage.getItem('token');
fetch('https://handsandhope-31gp.onrender.com/api/products', {
  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
})
  .then(r => r.json())
  .then(d => console.log('✅ Success! Products:', d))
  .catch(e => console.error('❌ Error:', e))
```

If you see `✅ Success!`, the environment variable is working correctly! 🎉

---

## 🔄 If You Need to Change It Later

1. Go back to Environment Variables
2. Click the ⋯ (three dots) next to the variable
3. Choose **Edit** or **Delete**
4. Make your changes
5. Save and redeploy

---

## ⚡ Common Issues

### Issue: Variable not updating
- **Solution**: Wait 1-2 minutes for Vercel to redeploy
- Check Deployments tab to see if new deploy is in progress

### Issue: Still getting "localhost" error
- **Solution**: 
  1. Clear browser cache (Ctrl+Shift+Delete)
  2. Hard refresh (Ctrl+F5)
  3. Check that environment variable is set for Production environment

### Issue: Backend URL not recognized
- **Solution**: Make sure it's exactly:
  ```
  https://handsandhope-31gp.onrender.com
  ```
  (no trailing slash, no /api prefix)

---

## 📋 Environment Variables Status Check

To verify environment variables are set, check your **Function Logs** in Vercel:
1. Go to your Vercel project
2. Click **Deployments**
3. Click on the latest deployment
4. Click **Function Logs**
5. Look for `API Base URL: https://handsandhope-31gp.onrender.com`

---

## 🎯 Final Checklist

- [ ] Logged into Vercel
- [ ] Added `VITE_API_URL=https://handsandhope-31gp.onrender.com` to Buyers2
- [ ] Added `VITE_API_URL=https://handsandhope-31gp.onrender.com` to Sellers2
- [ ] Selected all three environments (Production, Preview, Development)
- [ ] Clicked Save for both projects
- [ ] Triggered redeploy for both projects
- [ ] Verified with browser console test
- [ ] Tested login functionality

---

**Done!** Your Vercel apps should now be connecting to your Render backend. 🚀
