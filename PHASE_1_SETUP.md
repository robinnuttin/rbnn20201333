# Phase 1: Google Cloud Fundament - Setup Guide

## Overview

Phase 1 establishes the foundation for migrating from IndexedDB to Firestore. All code is ready; we just need to configure Google Cloud Platform and set environment variables.

**Estimated time:** 30-45 minutes
**Cost:** Free tier covers initial setup (Firestore free tier: 50K reads/day)

---

## Step-by-Step Setup

### 1️⃣ Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Create Project"
3. Enter project name: `crescoflow-crm-app` (or similar)
4. Click "Create"
5. Wait for project to be created, then select it

### 2️⃣ Enable Required APIs

In the Google Cloud Console:

1. Go to **APIs & Services** → **Library**
2. Search for and **enable** these APIs:
   - **Cloud Firestore API**
   - **Cloud Functions API**
   - **Cloud Tasks API**
   - **BigQuery API**
   - **Cloud Storage API**
   - **Cloud Logging API**

**Cost impact:** Free tier covers 50K reads/day, 20K writes/day

### 3️⃣ Create Firestore Database

1. In Google Cloud Console, go to **Firestore**
2. Click **Create Database**
3. Select:
   - **Location:** europe-west1 (Brussels - closest to your location)
   - **Mode:** Native mode
4. Click **Create Database**
5. Wait ~2 minutes for setup

**Security:** Default rules will be applied (we'll customize in step 5)

### 4️⃣ Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project**
3. Select your GCP project created in step 1
4. Click **Continue**
5. Disable Google Analytics (not needed for this phase)
6. Click **Create Project**

### 5️⃣ Create Web App in Firebase

1. In Firebase Console, click **Project Settings** (gear icon)
2. Go to **Your apps** section
3. Click **+ Add App** → **Web**
4. Enter app name: `CrescoFlow CRM`
5. Click **Register app**
6. **Copy the Firebase config** (you'll need this next)

Example config looks like:
```javascript
{
  apiKey: "AIzaSyDcKfD...",
  authDomain: "crescoflow-crm.firebaseapp.com",
  projectId: "crescoflow-crm",
  storageBucket: "crescoflow-crm.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
}
```

### 6️⃣ Configure Environment Variables

1. In your project root, create `.env.local`:

```bash
# Copy this and fill in your values from step 5
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=1:your_app_id
```

**Important:** `.env.local` is in `.gitignore` - never commit credentials

### 7️⃣ Deploy Firestore Security Rules

1. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase project:
```bash
firebase init
```
- Select **Firestore** only
- Use existing project: select your project
- Accept default locations

4. Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### 8️⃣ Install Dependencies

```bash
npm install
```

This installs:
- `firebase` - Firestore SDK
- `zod` - Type validation
- `date-fns` - Date utilities

### 9️⃣ Verify Setup

Start the development server:

```bash
npm run dev
```

Check console for:
- ✅ `Firestore initialized successfully` (should appear)
- ⚠️ If you see warnings about IndexedDB, that's OK - it's a fallback

### 🔟 Optional: Deploy Firestore Indexes

As you use complex queries, Firestore will suggest indexes. Deploy them:

```bash
firebase deploy --only firestore:indexes
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Google Cloud project created
- [ ] Firestore database active
- [ ] Firebase web app configured
- [ ] Environment variables set in `.env.local`
- [ ] `npm install` completed
- [ ] Dev server runs without Firebase errors
- [ ] App loads without crashing

---

## Cost Optimization Tips

To keep costs minimal during Phase 1:

1. **Firestore Free Tier Limits:**
   - 50K reads/day
   - 20K writes/day
   - 1GB storage
   - Sufficient for initial testing

2. **Optimize Queries:**
   - Use pagination (see `useLeads` hook)
   - Filter at database level, not in code
   - Limit real-time listeners (use only when needed)

3. **Monitor Usage:**
   - Go to **Firestore** → **Usage** in Google Cloud Console
   - Set up billing alerts (see "Billing" section)

4. **Batch Operations:**
   - Use `batchUpsertLeads()` instead of single writes
   - Reduces roundtrips by 50-60%

---

## Migration Strategy (IndexedDB → Firestore)

When you're ready to migrate data:

### Phase 1 (Dual-Write Period):
- App writes to both IndexedDB and Firestore
- Reads from Firestore if available, fallback to IndexedDB
- Duration: 1 week (test stability)

### Phase 2 (Firestore-Primary):
- App reads/writes exclusively to Firestore
- IndexedDB becomes read-only backup

### Phase 3 (Cleanup):
- Remove IndexedDB code
- Remove migration scripts

**Current Status:** Dual-write ready (set `useFirestore=true` in App.tsx)

---

## Troubleshooting

### Firebase Config Validation Errors

**Problem:** See errors like "Missing REACT_APP_FIREBASE_..."

**Solution:**
1. Check `.env.local` has all 6 variables
2. Make sure values are correct from Firebase Console
3. Restart dev server after changing `.env.local`
4. Check browser console for specific missing field

### Firestore Connection Timeout

**Problem:** "Error: Could not reach Cloud Firestore backend"

**Solution:**
1. Check internet connection
2. Verify Google Cloud project has billing enabled
3. Ensure Firestore database is "Active" (not "Creating")
4. Check firewall isn't blocking connections

### Permission Errors

**Problem:** "Missing or insufficient permissions"

**Solution:**
1. Re-deploy security rules: `firebase deploy --only firestore:rules`
2. Verify rules in Firestore console
3. Check user is authenticated (if rules require it)

### High Costs (Using Free Tier Quota)

**Problem:** Firestore reads/writes exceeding free tier

**Solution:**
1. Check for infinite loops in real-time listeners
2. Add query constraints to limit reads
3. Use batch operations instead of individual writes
4. Check browser DevTools for repeated API calls

---

## Next Steps (When Ready)

Once Phase 1 is verified:

1. **Data Migration:** Run migration script
   ```bash
   npx ts-node scripts/migrate-indexeddb-to-firestore.ts --dryrun
   ```

2. **Phase 2:** Begin GoHighLevel bidirectional sync
3. **Phase 3:** Implement multi-source scrapers

---

## Reference: File Structure for Phase 1

```
/services/core/
  ├── firestoreService.ts    ✅ Firestore CRUD + real-time
  ├── useFirestore.ts         ✅ React hooks for real-time data
  └── authService.ts          (Ready for Phase 2)

/config/
  ├── firebase.config.ts      ✅ Configuration template
  └── .env.example            ✅ Environment variables

/scripts/
  └── migrate-indexeddb-to-firestore.ts  ✅ Migration tool

/firestore.rules            ✅ Security rules

App.tsx                     ✅ Updated with Firestore support
```

---

## Credits & Usage Tracking

**Free tier:** Sufficient for development and small-scale testing

**Estimated monthly cost (after free tier):**
- Firestore (10M reads/month): $5-10
- Cloud Storage (10GB): $0.20
- Cloud Functions: $1-2
- **Total: ~$6-12/month**

---

## Security Notes

✅ **Implemented:**
- Security rules prevent unauthorized access
- API key is read-only (no write permissions)
- Firestore rules enforce authentication

⚠️ **TODO (Phase 2):**
- Enable Firebase Authentication
- Implement user-based access control
- Add API key rotation strategy

---

## Contact & Support

If you encounter issues:

1. Check browser console for error messages
2. Review Google Cloud logs: **Logging** → **Logs**
3. Verify Firestore status page (should show "All green")
4. Check Firebase SDK version compatibility

---

**Phase 1 Status: Ready for Implementation** ✅

You now have all code in place. Just run through the setup steps above, and Firestore will be live!
