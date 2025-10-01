# Testing Checklist for HookCatch SaaS

## 🔧 **Environment Setup**
- [ ] Supabase project created and active
- [ ] Environment variables set in `.env` file
- [ ] Database migration applied (`supabase/migrations/0001_initial.sql`)
- [ ] Development server running (`npm start`)

## 🔐 **Authentication Testing**

### Registration
- [ ] Go to `/register`
- [ ] Fill out registration form with valid data
- [ ] Submit form - should create account
- [ ] Check email confirmation (if required)
- [ ] Verify redirect to dashboard

### Login
- [ ] Go to `/login`
- [ ] Enter valid credentials
- [ ] Submit form - should authenticate
- [ ] Verify redirect to dashboard
- [ ] Test with invalid credentials - should show error

### Route Protection
- [ ] Try accessing `/dashboard` without login - should redirect to `/login`
- [ ] Try accessing `/create-webhook` without login - should redirect to `/login`
- [ ] Login and verify protected routes are accessible

## 🎨 **Theme Functionality**

### Theme Persistence
- [ ] Go to `/account-settings`
- [ ] Change theme to "Dark" mode
- [ ] Refresh page - theme should persist
- [ ] Change theme to "Light" mode
- [ ] Refresh page - theme should persist
- [ ] Change theme to "System"
- [ ] Refresh page - theme should match system preference

### Theme Toggle
- [ ] Click theme toggle button in header
- [ ] Verify theme switches between light/dark
- [ ] Refresh page - verify theme persists

## 📊 **Dashboard Functionality**

### Data Loading
- [ ] Login and go to `/dashboard`
- [ ] Verify dashboard loads without errors
- [ ] Check that stats cards show real data (may be 0 for new users)
- [ ] Verify webhook table loads (may be empty for new users)

### Search and Filter
- [ ] Use search box to filter webhooks
- [ ] Use status filter dropdown
- [ ] Use sort dropdown
- [ ] Click "Clear Filters" button

### Navigation
- [ ] Click "Create New Webhook" button - should navigate to `/create-webhook`
- [ ] Click navigation items in header
- [ ] Click logo - should navigate to dashboard

## 🪝 **Webhook Management**

### Create Webhook
- [ ] Go to `/create-webhook`
- [ ] Fill out webhook form with valid data
- [ ] Click "Create Webhook" button
- [ ] Verify success modal appears
- [ ] Click "View Webhook" - should navigate to webhook details
- [ ] Click "Create Another" - should reset form

### Webhook Operations
- [ ] Go to dashboard and verify new webhook appears
- [ ] Click "Copy URL" button - should copy to clipboard
- [ ] Click "View" button - should navigate to webhook details
- [ ] Click "Delete" button - should show confirmation modal
- [ ] Click "Delete Webhook" in modal - should delete webhook
- [ ] Verify webhook disappears from dashboard

## 🚨 **Error Handling**

### Network Errors
- [ ] Disconnect internet
- [ ] Try to create webhook - should show error message
- [ ] Reconnect internet
- [ ] Try again - should work

### Validation Errors
- [ ] Try to create webhook with empty fields
- [ ] Should show validation errors
- [ ] Fix errors and submit - should work

## 📱 **Mobile Responsiveness**
- [ ] Resize browser to mobile size
- [ ] Test navigation menu
- [ ] Test webhook table (should show cards)
- [ ] Test all buttons and forms

## 🔄 **Real-time Updates**
- [ ] Open dashboard in two browser tabs
- [ ] Create webhook in one tab
- [ ] Refresh other tab - should show new webhook
- [ ] Delete webhook in one tab
- [ ] Refresh other tab - webhook should be gone

## 🐛 **Common Issues to Check**

### Delete Not Working
- [ ] Check browser console for errors
- [ ] Verify Supabase connection
- [ ] Check RLS policies are applied
- [ ] Verify webhook ID is valid

### Theme Not Persisting
- [ ] Check localStorage in browser dev tools
- [ ] Verify theme initialization in main.tsx
- [ ] Check for JavaScript errors

### Buttons Not Working
- [ ] Check for JavaScript errors in console
- [ ] Verify event handlers are attached
- [ ] Check for CSS conflicts
- [ ] Verify components are properly imported

## 📋 **Performance Testing**
- [ ] Test with slow network connection
- [ ] Check loading states appear
- [ ] Verify error messages are user-friendly
- [ ] Test with large number of webhooks

## 🔒 **Security Testing**
- [ ] Try to access other users' webhooks
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test with invalid authentication tokens

## ✅ **Final Verification**
- [ ] All buttons respond to clicks
- [ ] All forms submit correctly
- [ ] All navigation works
- [ ] Theme persists across refreshes
- [ ] Delete functionality works
- [ ] Error messages are helpful
- [ ] Success messages appear
- [ ] Mobile experience is good

---

## 🚀 **Quick Test Script**

Run this in browser console to test basic functionality:

```javascript
// Test theme functionality
localStorage.setItem('theme', 'dark');
document.documentElement.classList.add('dark');

// Test if components are loaded
console.log('Dashboard loaded:', !!document.querySelector('[data-testid="dashboard"]'));
console.log('Theme toggle loaded:', !!document.querySelector('[title*="Switch to"]'));

// Test webhook creation
const createButton = document.querySelector('button:contains("Create New Webhook")');
if (createButton) console.log('Create button found');
```

## 🆘 **Troubleshooting**

If something doesn't work:

1. **Check Console**: Open browser dev tools and look for errors
2. **Check Network**: Verify Supabase requests are successful
3. **Check Environment**: Ensure `.env` file has correct values
4. **Check Database**: Verify migration was applied successfully
5. **Check RLS**: Ensure Row Level Security policies are active

Remember: The app will work best when properly connected to Supabase with the migration applied!
