# 🗄️ MongoDB Atlas Setup Guide for Production Backend

## Overview
Your Render backend currently uses localhost MongoDB. For production, you need MongoDB Atlas (MongoDB's cloud database service).

---

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click **Try Free** or **Sign Up**
3. Create account with email/password or Google
4. Verify your email
5. Complete setup wizard

---

## Step 2: Create a Cluster

1. In MongoDB Atlas dashboard, click **+ Create**
2. Select **Build a Cluster**
3. Choose **Free** tier (M0 - good for development)
4. Select your preferred region (e.g., us-east-1 or eu-west-1)
5. Click **Create Cluster** and wait 2-3 minutes

---

## Step 3: Create Database User

1. In left sidebar, click **Database Access**
2. Click **+ Add New Database User**
3. Enter:
   - **Username**: `handsandhope_admin` (or your choice)
   - **Password**: Create a strong password
   - **Role**: `readWriteAnyDatabase`
4. Click **Add User**
5. **Save username and password** - you'll need them!

---

## Step 4: Whitelist IP Address

1. In left sidebar, click **Network Access**
2. Click **+ Add IP Address**
3. Two options:
   - **Option A**: Allow Render.com IPs (Recommended for production)
     - Click **Add a Different IP Address**
     - Add: `0.0.0.0/0` (allows all - for testing)
     - Or add specific Render IP from your dashboard
   - **Option B**: Add your current IP
     - Click **Add Current IP**
4. Click **Confirm**

---

## Step 5: Get Connection String

1. Click **Clusters** in left sidebar
2. Find your cluster
3. Click **Connect** button
4. Choose **Drivers**
5. Select **Node.js** and version **4.x**
6. Copy the connection string

**You'll get something like:**
```
mongodb+srv://handsandhope_admin:PASSWORD@cluster0.mongodb.net/?retryWrites=true&w=majority
```

**Replace:**
- `PASSWORD` → Your actual database user password
- `handsandhope_admin` → Your username

---

## Step 6: Update Backend Configuration

### Option A: Using Environment Variables (Recommended)

1. Update your backend `.env` file:
```env
MONGODB_URI=mongodb+srv://handsandhope_admin:YOUR_PASSWORD@cluster0.mongodb.net/hands-and-hope?retryWrites=true&w=majority
```

2. In your `backend/config/db.js`, update:
```javascript
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hands-and-hope';
```

### Option B: Direct Update to server.js

```javascript
const mongoose = require('mongoose');

const mongoURI = 'mongodb+srv://handsandhope_admin:YOUR_PASSWORD@cluster0.mongodb.net/hands-and-hope?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));
```

---

## Step 7: Add to Render Environment Variables

1. Go to https://dashboard.render.com
2. Click your backend service
3. Go to **Environment**
4. Click **Add Environment Variable**
5. Add:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://handsandhope_admin:YOUR_PASSWORD@cluster0.mongodb.net/hands-and-hope?retryWrites=true&w=majority`
6. Click **Save Changes**
7. Render will automatically redeploy

---

## Step 8: Test Connection

### Via Render Dashboard:
1. Go to your Render service
2. Click **Logs**
3. Look for: `Connected to MongoDB Atlas` ✅

### Via Backend API:
```bash
curl https://handsandhope-31gp.onrender.com/api/products
```

Should return JSON with products (or empty array if no products yet).

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas account created
- [ ] Free cluster created and running
- [ ] Database user created (username & password saved)
- [ ] IP addresses whitelisted (0.0.0.0/0 or Render IP)
- [ ] Connection string copied and tested
- [ ] Backend `.env` or config updated with MongoDB URI
- [ ] Render environment variable `MONGODB_URI` added
- [ ] Backend redeployed after env var change
- [ ] Logs show "Connected to MongoDB Atlas"

---

## 🔐 Security Best Practices

### For Production:
1. **Use strong passwords** for database users
2. **Don't hardcode credentials** - always use environment variables
3. **Limit IP access** - use specific Render IP instead of 0.0.0.0/0 when possible
4. **Rotate credentials** if compromised
5. **Use separate users** for different apps (one for Render, one for local dev)

### For Development:
1. Create a separate database user
2. Use 0.0.0.0/0 for IP whitelist (for convenience)
3. Never commit `.env` file to Git

---

## 📊 MongoDB Atlas Features

### Your Free Cluster Includes:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Unlimited collections
- ✅ Automatic backups
- ✅ Up to 100 concurrent connections

### If You Need More:
- Upgrade to M2/M5 tier ($9-55/month)
- More storage (10-100+ GB)
- Dedicated resources
- Advanced monitoring

---

## 🚨 Troubleshooting

### Connection Timeout?
1. Check IP is whitelisted in Network Access
2. Verify connection string is correct
3. Check username/password (no special chars)
4. Wait a few minutes for whitelist changes to apply

### Authentication Failed?
1. Verify database username exists in Database Access
2. Check password exactly matches
3. If password has special chars, URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - Etc.

### Cluster Not Found?
1. Check you're using correct cluster name
2. Verify you selected the right region
3. Try recreating cluster if broken

### Lost Connection After Deploy?
1. Check `MONGODB_URI` in Render environment
2. Verify IP whitelist still allows Render
3. Check MongoDB Atlas cluster status (active)

---

## 📚 Example Data Models Ready to Use

Your backend already has these Mongoose models:
- User
- Seller
- Buyer
- Product
- Order
- Inquiry
- Withdrawal
- Refund
- School
- Teacher
- Student
- Caregiver
- AssistanceRequest

They'll work immediately with MongoDB Atlas!

---

## 🔗 Useful Links

- **MongoDB Atlas**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Documentation**: https://docs.mongodb.com/
- **Connection Troubleshooting**: https://docs.mongodb.com/drivers/node/current/

---

## 💾 Local Development Setup

### To keep using localhost locally:

Keep your local MongoDB running:
```bash
# Windows (if MongoDB installed)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

Create `.env.local` for local development:
```env
MONGODB_URI=mongodb://localhost:27017/hands-and-hope
PORT=5000
NODE_ENV=development
```

Your Render backend uses MongoDB Atlas, local development uses localhost - best of both worlds!

---

**Status**: ✅ Ready to configure  
**Last Updated**: 2026-07-16
