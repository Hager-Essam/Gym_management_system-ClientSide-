# Backend API Integration - Complete

## Current React endpoint coverage

The React app now uses the Node API for authentication, member profiles and
attendance history, public plans and admin plan management, member management,
subscriptions, payments, attendance check-in/out, and the `/health` status
indicator. Admin views use the API rather than localStorage for members and
plans; subscription, payment, and attendance sections load live API data.

The backend does not currently expose admin endpoints to create staff or
members. Admin member creation is therefore not offered; the existing
trainer/manager forms remain local demo functionality. The frontend also does
not submit payments through `POST /api/payments`, which currently records a
payment as completed without a payment-provider workflow.

## ✅ What Was Done

I've successfully integrated your gym management system with the backend API while **preserving all your existing UI design**.

---

## 📦 New Files Created

### 1. API Integration
- `src/services/apiClient.js` - Axios client with token management
- `.env` - Environment configuration

### 2. Service Files (API Wrappers)
- `src/services/planService.js` - Plans API
- `src/services/memberService.js` - Member profile API
- `src/services/subscriptionService.js` - Subscription management API
- `src/services/attendanceService.js` - Check-in/out API
- `src/services/paymentService.js` - Payment history API

### 3. Dependencies
- ✅ Installed `axios` for HTTP requests

---

## 🔄 Modified Files

### `src/services/authService.js`
- **BEFORE**: Used localStorage mock authentication
- **AFTER**: Connects to real backend API at `/api/auth/login` and `/api/auth/register`
- **Design**: NO UI changes, same interface

---

## 🎯 How to Use the New Services

### Authentication (Already Updated)
```javascript
// In LoginPage.jsx or RegisterPage.jsx
import { loginUser, registerUser } from '../services/authService.js';

// These now call the real API automatically
await loginUser({ email, password });
await registerUser({ fullName, email, password, planId });
```

### Plans
```javascript
import { getAllPlans, getActivePlans } from '../services/planService.js';

// Get all membership plans
const plans = await getAllPlans();

// Get only active plans
const activePlans = await getActivePlans();
```

### Member Profile
```javascript
import { getMyProfile, updateMyProfile } from '../services/memberService.js';

// Get current user's profile
const profile = await getMyProfile();

// Update profile
await updateMyProfile({
  fullName: 'John Doe',
  phone: '555-1234',
  dateOfBirth: '1990-01-01',
  // ... other fields
});
```

### Subscriptions
```javascript
import { 
  getMySubscription, 
  createSubscription, 
  cancelSubscription 
} from '../services/subscriptionService.js';

// Get current subscription
const subscription = await getMySubscription();

// Subscribe to a plan
await createSubscription({ planId: '1' });

// Cancel subscription
await cancelSubscription();
```

### Attendance
```javascript
import { checkIn, checkOut, getMyAttendance } from '../services/attendanceService.js';

// Check in
const checkin = await checkIn();

// Check out
await checkOut(checkin.id);

// Get attendance history
const attendance = await getMyAttendance({ limit: 20 });
```

### Payments
```javascript
import { getMyPayments } from '../services/paymentService.js';

// Get payment history
const payments = await getMyPayments({ limit: 20 });
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=IronForge Gym System
VITE_APP_VERSION=1.0.0
```

### API Base URL
The system automatically uses:
- **Development**: `http://localhost:5000` (from .env)
- **Production**: Set `VITE_API_BASE_URL` to your production API URL

---

> The historical examples below describe the earlier integration stage and are
> superseded by the current endpoint coverage at the top of this document.
> Check the service files and active pages before following those examples.

## 🚀 Historical Next Steps

### 1. Update Existing Pages to Use Real Data

#### Example: Update MemberDashboard.jsx
```javascript
import { useState, useEffect } from 'react';
import { getMyProfile } from '../services/memberService.js';
import { getMyAttendance } from '../services/attendanceService.js';
import { getMySubscription } from '../services/subscriptionService.js';

export default function MemberDashboard() {
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, attendanceData, subData] = await Promise.all([
          getMyProfile(),
          getMyAttendance({ limit: 10 }),
          getMySubscription(),
        ]);
        
        setProfile(profileData.user);
        setAttendance(attendanceData.attendance || []);
        setSubscription(subData.subscription);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  // Use profile, attendance, subscription data in your UI
  // ... rest of your existing component
}
```

### 2. Create Missing Pages

You need to create these pages to complete the member flow:

#### A. Profile Edit Page
**File**: `src/pages/MemberProfile.jsx`
```javascript
import { useState, useEffect } from 'react';
import { getMyProfile, updateMyProfile } from '../services/memberService.js';
import DashboardNav from '../components/layout/DashboardNav.jsx';

export default function MemberProfile() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    // ... other fields
  });

  useEffect(() => {
    async function loadProfile() {
      const data = await getMyProfile();
      setFormData(data.user);
    }
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateMyProfile(formData);
    alert('Profile updated!');
  };

  return (
    <div>
      <DashboardNav />
      <form onSubmit={handleSubmit}>
        {/* Your existing form UI */}
      </form>
    </div>
  );
}
```

#### B. Plans Page
**File**: `src/pages/PlansPage.jsx`
```javascript
import { useState, useEffect } from 'react';
import { getActivePlans } from '../services/planService.js';
import { createSubscription } from '../services/subscriptionService.js';
import DashboardNav from '../components/layout/DashboardNav.jsx';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    async function loadPlans() {
      const data = await getActivePlans();
      setPlans(data);
    }
    loadPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    await createSubscription({ planId });
    alert('Subscription request sent!');
  };

  return (
    <div>
      <DashboardNav />
      {/* Your existing plans UI with plan cards */}
      {plans.map(plan => (
        <div key={plan.id}>
          <h3>{plan.name}</h3>
          <p>${plan.price}</p>
          <button onClick={() => handleSubscribe(plan.id)}>
            Subscribe
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### C. Subscription Management Page
**File**: `src/pages/MySubscription.jsx`

#### D. Attendance History Page
**File**: `src/pages/AttendanceHistory.jsx`

#### E. Payment History Page
**File**: `src/pages/PaymentHistory.jsx`

### 3. Update Routes in App.jsx
```javascript
import MemberProfile from './pages/MemberProfile.jsx';
import PlansPage from './pages/PlansPage.jsx';
import MySubscription from './pages/MySubscription.jsx';
import AttendanceHistory from './pages/AttendanceHistory.jsx';
import PaymentHistory from './pages/PaymentHistory.jsx';

// In your Routes:
<Route path="/dashboard/profile" element={<MemberProfile />} />
<Route path="/dashboard/plans" element={<PlansPage />} />
<Route path="/dashboard/subscription" element={<MySubscription />} />
<Route path="/dashboard/attendance" element={<AttendanceHistory />} />
<Route path="/dashboard/payments" element={<PaymentHistory />} />
```

---

## 🎨 Design Preservation

### ✅ What Stays the Same:
- All your existing CSS styles
- All your existing components (Button, Icon, Cards, etc.)
- All your color schemes and layouts
- All your custom UI elements
- Your dashboard designs

### ✅ What Changes:
- **Data source**: Now from real API instead of localStorage
- **Authentication**: Real JWT tokens
- **State management**: Real server data

---

## 🔐 Authentication Flow

### How It Works Now:
1. User logs in via LoginPage
2. `authService.loginUser()` calls `/api/auth/login`
3. Backend returns `accessToken` and `refreshToken`
4. Tokens are stored in localStorage
5. All subsequent API calls include the token
6. Token auto-refreshes when expired
7. User redirected to login if refresh fails

---

## 🐛 Error Handling

All services throw meaningful errors:
```javascript
try {
  await checkIn();
} catch (error) {
  // error.message contains user-friendly message
  alert(error.message); // "Check-in failed" or specific error
}
```

---

## 📊 API Response Format

The backend returns data in this format:
```javascript
{
  success: true,
  data: {
    user: { ... },
    // or plans: [ ... ],
    // or subscription: { ... }
  },
  message: "Success message"
}
```

The services automatically extract the `data` field for you.

---

## ✅ Testing Checklist

### 1. Authentication
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout
- [ ] Token refresh on expiry

### 2. Member Profile
- [ ] View profile data
- [ ] Update profile fields
- [ ] Save changes

### 3. Plans
- [ ] View all available plans
- [ ] Subscribe to a plan
- [ ] See subscription status

### 4. Attendance
- [ ] Check in
- [ ] Check out
- [ ] View attendance history

### 5. Payments
- [ ] View payment history
- [ ] See transaction details

---

## 🚀 Starting the System

### Backend (API)
```bash
cd Gym_Management_SYS_API
npm start
# Runs on http://localhost:5000
```

### Frontend (This Project)
```bash
cd gym-management-system-main
npm run dev
# Runs on http://localhost:5173 or 5174
```

---

## 💡 Pro Tips

1. **Keep Your Design**: Don't change any CSS or component files. Just update the data fetching logic.

2. **Use Existing Components**: Your Button, Icon, Card components work perfectly with the new data.

3. **Error Messages**: The services return user-friendly error messages. Just display them in your UI.

4. **Loading States**: Add loading indicators while data is being fetched:
   ```javascript
   {loading ? <Spinner /> : <YourContent />}
   ```

5. **Real-time Updates**: After actions (subscribe, check-in), refetch the data to show updated state.

---

## 📝 Summary

✅ **Backend API is connected**  
✅ **Authentication works with real tokens**  
✅ **All service files are ready**  
✅ **Your UI design is preserved**  
✅ **Ready for you to integrate into pages**

**Next**: Update your existing pages to use the new service files instead of mock data!
