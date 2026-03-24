# 📊 How to Use Funnels in G5 Analytics

## What is a Funnel?

A **funnel** tracks how users progress through a sequence of events. It shows you:
- How many users complete each step
- Where users drop off
- Conversion rates between steps

**Example Use Cases:**
- **Sign-up funnel**: `Page View` → `Sign Up` → `Email Verified` → `First Purchase`
- **Checkout funnel**: `Add to Cart` → `Checkout Started` → `Payment Info` → `Purchase`
- **Onboarding funnel**: `Sign Up` → `Profile Created` → `First Action` → `Invited Friend`

---

## How to Create a Funnel

### 1. Navigate to Funnels
Click **"Funnels"** in the left sidebar.

### 2. Define Your Steps
- **Step 1**: Select the first event (e.g., "Sign Up")
- **Step 2**: Select the second event (e.g., "Login")
- **Add more steps**: Click "+ Add step" to add additional events (up to 10 steps)
- **Remove steps**: Click the ❌ icon next to any step (minimum 2 steps required)

### 3. Set Conversion Window
Choose how long users have to complete the funnel:
- **1 hour** - For quick flows (e.g., checkout process)
- **1 day** - For same-day conversions
- **7 days** - For weekly onboarding flows
- **30 days** - For long-term conversion tracking

### 4. Calculate
Click **"Calculate"** to run the funnel analysis.

---

## Understanding the Results

The funnel chart shows:

```
Step 1: Sign Up          [████████████████████] 100 users (100%)
                              ↓ 80% conversion
Step 2: Login            [████████████████    ]  80 users (80%)
                              ↓ 62.5% conversion
Step 3: Feature Used     [██████████          ]  50 users (50%)
```

### Key Metrics:
- **Count**: Number of users who completed this step
- **Conversion Rate**: % of users from previous step who completed this step
- **Overall Conversion**: % of users from Step 1 who reached this step

---

## Example: E-commerce Checkout Funnel

**Goal**: Track how many users complete a purchase

**Steps:**
1. `Page View` (Product page)
2. `Add to Cart`
3. `Checkout Started`
4. `Payment Info`
5. `Purchase`

**Conversion Window**: 1 day

**Insights:**
- If 1000 users view products but only 50 purchase → 5% conversion
- If drop-off is high between "Checkout Started" and "Payment Info" → investigate payment UX

---

## Tips & Best Practices

### ✅ Do:
- **Use sequential events** that represent a logical user journey
- **Set realistic conversion windows** based on your product
- **Track critical paths** like sign-up, onboarding, checkout
- **Compare funnels** over time to measure improvements

### ❌ Don't:
- Use unrelated events (e.g., "Login" → "Logout" → "Purchase")
- Set conversion windows too short (users need time!)
- Create too many steps (5-7 is optimal)

---

## Advanced: Conversion Window Explained

The **conversion window** is the maximum time between events for a user to be counted.

**Example with 1-day window:**
- User does "Sign Up" on Monday 9am
- User does "Login" on Monday 11am ✅ **Counted** (within 24 hours)
- User does "Feature Used" on Wednesday 10am ❌ **Not counted** (>24 hours from Login)

**Choose based on your product:**
- **SaaS onboarding**: 7-30 days
- **E-commerce checkout**: 1 hour - 1 day
- **Mobile app activation**: 1-7 days

---

## Your Current Events

Based on your seeded data, you have these events available:
- **Debug Event**
- **Feature Used**
- **Login**
- **Page View**
- **Sign Up**
- **Test Event**
- **Upgrade**

### Example Funnel You Can Try Now:

**User Activation Funnel:**
1. `Sign Up`
2. `Login`
3. `Feature Used`

**Conversion Window**: 7 days

This will show you how many users who signed up actually logged in and used a feature!

---

## Need Help?

- Check the **Insights** page to see individual event volumes
- Use **Retention** to see if users come back after completing the funnel
- Use **Flows** to discover unexpected user paths

Happy analyzing! 🚀

