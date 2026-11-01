# AIVA — Manual Testing Checklist

Use this checklist to verify each feature works end-to-end.

---

## 1. Environment & Startup

- [ ] Backend starts without errors: `uvicorn app.main:app --reload`
- [ ] Frontend starts without errors: `pnpm dev`
- [ ] Health check returns OK: `GET http://localhost:8000/health`
- [ ] Ollama is accessible: `curl http://localhost:11434`
- [ ] Database connection works (check backend startup logs)

## 2. Landing Page

- [ ] Page loads at http://localhost:3000
- [ ] AIVA branding and features are displayed
- [ ] "Continue with Google" button is visible
- [ ] Telegram bot link is visible
- [ ] Page is responsive on mobile viewport

## 3. Authentication

- [ ] Clicking "Continue with Google" opens Google sign-in
- [ ] After sign-in, redirected to /dashboard
- [ ] User name and avatar appear in header
- [ ] Profile is created in database
- [ ] Sign-out button works
- [ ] After sign-out, cannot access /dashboard (redirected)
- [ ] Cannot access /admin as regular user

## 4. Student Dashboard

- [ ] Shows welcome message with user name
- [ ] Stats cards show correct counts (initially 0)
- [ ] Quick action buttons work
- [ ] Recent conversations list shows (empty initially)

## 5. AI Chat

- [ ] Can start a new conversation
- [ ] Can send a text message
- [ ] AI responds with relevant hostel-related answer
- [ ] Loading indicator shows while AI processes
- [ ] Messages have timestamps
- [ ] Conversation persists when leaving and returning
- [ ] Can start multiple conversations
- [ ] Previous conversations appear in sidebar
- [ ] Can attach an image
- [ ] "Request Human Help" button creates handover request
- [ ] Error state shows if AI is unavailable
- [ ] Conversation history is preserved across browser refresh

## 6. Complaints

- [ ] Can create a new complaint with all fields
- [ ] Category dropdown shows all options
- [ ] Complaint gets a reference number (AIVA-XXXXXXXX-XXXX)
- [ ] Can attach image to complaint
- [ ] Complaint appears in list
- [ ] Can view complaint details
- [ ] Status badge shows correct color
- [ ] Cannot see other users' complaints
- [ ] Can track complaint by reference number

## 7. Lost & Found

- [ ] Can report a lost item
- [ ] Can report a found item
- [ ] Can attach image
- [ ] Items appear in search
- [ ] Can filter by type and category
- [ ] Contact info is protected (not shown to non-owners)
- [ ] Can update item status

## 8. Admin Dashboard

- [ ] Only accessible by admin users
- [ ] Shows correct statistics from database
- [ ] 25-conversation progress shows actual count
- [ ] Daily stats are accurate
- [ ] CSV export downloads valid file
- [ ] Platform stats show web vs telegram breakdown

## 9. Admin Complaint Management

- [ ] Shows all complaints from all users
- [ ] Can filter by category, status, priority
- [ ] Can update complaint status
- [ ] Can assign to staff
- [ ] Can add internal notes
- [ ] Can reply to user
- [ ] Status changes reflect in user's view

## 10. Human Handover

- [ ] Pending handovers appear in admin dashboard
- [ ] Admin can claim a handover
- [ ] Admin can send messages in the conversation
- [ ] User sees staff messages (not AI)
- [ ] Admin can resolve and return to AI
- [ ] AI resumes responding after handover resolved

## 11. Telegram Bot

- [ ] /start sends welcome message
- [ ] /help lists available commands
- [ ] /complaint starts complaint workflow
- [ ] Can complete complaint registration through Telegram
- [ ] /status shows complaint status
- [ ] /lost starts lost item report
- [ ] /human requests human assistance
- [ ] /cancel cancels current operation
- [ ] /link connects to web account
- [ ] Text messages get AI responses
- [ ] Photo messages are stored
- [ ] Duplicate messages don't create duplicate records

## 12. Media Handling

- [ ] Can upload JPEG, PNG, GIF, WebP images
- [ ] Can upload PDF files
- [ ] Files over 10MB are rejected
- [ ] Invalid file types are rejected
- [ ] Uploaded files are accessible via signed URL
- [ ] Cannot access other users' files
- [ ] Missing files handled gracefully

## 13. Security

- [ ] API returns 401 without auth token
- [ ] Cannot access other users' conversations
- [ ] Cannot access other users' complaints
- [ ] Admin routes return 403 for regular users
- [ ] Error messages don't expose internal details
- [ ] Webhook endpoint validates secret token
- [ ] Invalid webhook tokens are rejected
- [ ] Rate limiting is active (test with rapid requests)

## 14. Data Persistence

- [ ] Conversations persist across server restarts
- [ ] Complaints persist across server restarts
- [ ] User profiles persist
- [ ] Analytics events are recorded
- [ ] Feedback is stored

## 15. Analytics Accuracy

- [ ] Total users matches actual registered users
- [ ] Total conversations matches actual conversations
- [ ] Complaint counts are accurate
- [ ] Response time is measured and displayed
- [ ] CSV export contains accurate data
- [ ] No fake or seeded data in statistics

---

## How to Promote a User to Admin

Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@gmail.com';
```

**Never** expose an API endpoint that allows self-promotion to admin.
