# Hands & Hope - Production Deployment Configuration

## 🎯 Deployment Status

### Frontend Applications
- **Buyers App**: https://handsandhope-one.vercel.app/
- **Sellers App**: https://handsandhope-sellers.vercel.app/

### Backend API
- **Backend Server**: https://handsandhope-31gp.onrender.com/

---

## ✅ What's Been Updated

### 1. **Buyers2 Frontend** (Vercel)
- ✅ API base URL already configured to use Render backend
- ✅ All endpoints pointing to: `https://handsandhope-31gp.onrender.com`
- ✅ .env.example created with VITE_API_URL variable

### 2. **Sellers2 Frontend** (Vercel)
- ✅ Updated API base URL from `/api` to `https://handsandhope-31gp.onrender.com`
- ✅ All endpoints now include `/api` prefix for Render backend
- ✅ .env.example created with VITE_API_URL variable

### 3. **Backend** (Render)
- ✅ Swagger/OpenAPI documentation comments added to all routes
- ✅ Backend ready at https://handsandhope-31gp.onrender.com

---

## 🔧 Environment Variables Setup

### For Vercel (Buyers2 & Sellers2)

1. Go to your Vercel project settings
2. Navigate to **Settings > Environment Variables**
3. Add the following variable to **all environments** (Production, Preview, Development):

```
VITE_API_URL=https://handsandhope-31gp.onrender.com
```

**Steps in Vercel:**
- Project Settings → Environment Variables
- Name: `VITE_API_URL`
- Value: `https://handsandhope-31gp.onrender.com`
- Environments: Check all (Production, Preview, Development)
- Click "Save"

### Local Development

If running locally, create a `.env.local` file:

**For Buyers2:**
```
VITE_API_URL=http://localhost:5000
```

**For Sellers2:**
```
VITE_API_URL=http://localhost:5000
```

---

## 🗄️ MongoDB Configuration

### Important: Update MongoDB Connection String

Your backend needs to use MongoDB Atlas (cloud) instead of localhost for production.

**In your backend `.env` file:**

```env
# Replace localhost with your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/hands-and-hope?retryWrites=true&w=majority
```

**Steps:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster or use existing
3. Get your connection string from: **Database > Connect > Drivers**
4. Format: `mongodb+srv://user:password@cluster.mongodb.net/database-name`
5. Update your backend `.env` file in Render

---

## 📡 API Endpoints Summary

### Base URL: `https://handsandhope-31gp.onrender.com`

### Authentication Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Buyer Routes
- `POST /api/buyers/register` - Register buyer
- `POST /api/buyers/login` - Buyer login
- `GET /api/buyers/profile` - Get profile (protected)
- `PUT /api/buyers/deactivate` - Deactivate account (protected)
- `DELETE /api/buyers/delete` - Delete account (protected)

### Product Routes
- `GET /api/products` - Get all products
- `GET /api/products/seller` - Get seller's products (protected)
- `POST /api/products` - Create product (protected)
- `PUT /api/products/{id}` - Update product (protected)
- `DELETE /api/products/{id}` - Delete product (protected)

### Seller Routes
- `GET /api/sellers/profile` - Get profile (protected)
- `PUT /api/sellers/profile` - Update profile (protected)
- `PUT /api/sellers/deactivate` - Deactivate account (protected)
- `DELETE /api/sellers/delete` - Delete account (protected)

### Dashboard Routes (Protected - requires JWT token)
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/profile` - User profile details
- `PUT /api/dashboard/profile` - Update profile
- `GET /api/dashboard/settings` - Account settings
- `PUT /api/dashboard/settings` - Update settings
- `PUT /api/dashboard/settings/password` - Change password
- `GET /api/dashboard/products` - User's products
- `GET /api/dashboard/orders` - Orders list
- `GET /api/dashboard/inquiries` - Buyer inquiries
- `PUT /api/dashboard/inquiries/{id}/reply` - Reply to inquiry
- `PUT /api/dashboard/inquiries/{id}/archive` - Archive inquiry
- `DELETE /api/dashboard/inquiries/{id}` - Delete inquiry
- `GET /api/dashboard/caregivers` - List caregivers
- `POST /api/dashboard/caregivers` - Add caregiver
- `PUT /api/dashboard/caregivers/{id}/permissions` - Update caregiver permissions
- `DELETE /api/dashboard/caregivers/{id}` - Remove caregiver
- `GET /api/dashboard/withdrawals` - Withdrawal data
- `GET /api/dashboard/messages` - Messages/inquiries
- `POST /api/dashboard/assistance/teacher` - Send message to teacher
- `POST /api/dashboard/assistance/school` - Send message to school
- `GET /api/dashboard/analytics` - Detailed analytics
- `GET /api/dashboard/refunds` - Refund data

---

## 🔐 CORS Configuration (Backend)

Your backend at Render should allow requests from:
- `https://handsandhope-one.vercel.app` (Buyers app)
- `https://handsandhope-sellers.vercel.app` (Sellers app)
- `http://localhost:3000` (Local development)

**Backend server.js CORS setup:**
```javascript
const cors = require('cors');
const app = express();

const allowedOrigins = [
  'https://handsandhope-one.vercel.app',
  'https://handsandhope-sellers.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

## 📝 Testing the Connection

### Test from Browser Console:

**Buyers app (https://handsandhope-one.vercel.app/):**
```javascript
fetch('https://handsandhope-31gp.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Backend connected!', d))
  .catch(e => console.error('❌ Backend error:', e))
```

**Sellers app (https://handsandhope-sellers.vercel.app/):**
```javascript
const token = localStorage.getItem('token'); // Get your JWT token
fetch('https://handsandhope-31gp.onrender.com/api/sellers/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(r => r.json())
  .then(d => console.log('✅ Backend connected!', d))
  .catch(e => console.error('❌ Backend error:', e))
```

---

## 🚀 Deployment Checklist

- [ ] **Vercel** - Set `VITE_API_URL` environment variable for both apps
- [ ] **Render Backend** - Verify MongoDB Atlas connection string in `.env`
- [ ] **Backend CORS** - Ensure Vercel URLs are in allowed origins
- [ ] **Test Login** - Try signing up and logging in on both apps
- [ ] **Test API Calls** - Verify products, orders, and dashboard endpoints work
- [ ] **Monitor** - Check Render logs for errors: `https://dashboard.render.com`

---

## 🐛 Troubleshooting

### "API call failed" or CORS errors?
1. Check Render backend is running: https://handsandhope-31gp.onrender.com
2. Verify CORS configuration includes Vercel URLs
3. Check browser console for exact error message

### MongoDB connection error?
1. Verify MongoDB Atlas connection string in backend `.env`
2. Whitelist Render IP in MongoDB Atlas
3. Check database exists and credentials are correct

### Environment variables not working?
1. Vercel takes ~1 minute to redeploy after env var change
2. Trigger redeploy: Settings > Redeploy from cache
3. Check that variables are set in correct environment

### Still getting localhost errors?
1. Clear browser cache and reload
2. Restart local development server if running locally
3. Check `.env.local` file is created and correct

---

## 📚 File Changes Made

### Buyers2
- `src/services/api.js` - Already using Render backend URL
- `.env.example` - Created with VITE_API_URL variable
- `.env.local` - Created for local development

### Sellers2
- `src/services/api.js` - Updated all endpoints to include `/api` prefix
- `.env.example` - Created with VITE_API_URL variable
- `.env.local` - Created for local development

### Backend (routes)
- `routes/authRoutes.js` - Added OpenAPI/Swagger comments
- `routes/buyerRoutes.js` - Added OpenAPI/Swagger comments
- `routes/productRoutes.js` - Added OpenAPI/Swagger comments
- `routes/sellerRoutes.js` - Added OpenAPI/Swagger comments
- `routes/dashboardRoutes.js` - Added OpenAPI/Swagger comments

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Swagger API Docs** (if enabled): https://handsandhope-31gp.onrender.com/api-docs

---

## 📞 Quick Reference

| Component | URL | Type |
|-----------|-----|------|
| Buyers Frontend | https://handsandhope-one.vercel.app | Vercel |
| Sellers Frontend | https://handsandhope-sellers.vercel.app | Vercel |
| Backend API | https://handsandhope-31gp.onrender.com | Render |
| MongoDB Database | MongoDB Atlas Cloud | Cloud |

---

**Last Updated**: 2026-07-16
**Status**: ✅ Production Ready
