# Marketing Role + Dashboard

## 1. Database
- Add `'marketing'` value to the `app_role` enum.
- No new tables. Reuse `user_roles` and existing `has_role()` checks.
- Update RLS where needed so the marketing role can:
  - Read `profiles` (already readable for targeting) — verify.
  - Manage `admin_broadcast_notifications` (currently admin-only `ALL`) → add policy allowing `has_role(auth.uid(),'marketing')`.
  - Upload to `marketing-images` storage bucket → extend existing admin policy to also allow marketing role.
- Edge function `broadcast-notification`: relax the admin check to allow admin OR marketing.

## 2. Hook update
- `src/hooks/useUserRole.ts`: add `'marketing'` to `UserRole` union and expose `isMarketing`.

## 3. New route + page
- `src/pages/MarketingDashboard.tsx` — header "Marketing Dashboard", two tabs:
  - Notifications (reuse `AdminNotificationCenter`)
  - Campaigns (reuse `MarketingCampaigns`)
- Add route `/marketing-dashboard` in `App.tsx` inside `RequireAuth` + `MainLayout`.

## 4. Access control
- `RequireAuth` (or a small guard inside `MarketingDashboard`): allow only `isAdmin || isMarketing`; otherwise redirect to `/dashboard`.
- `MainLayout` sidebar:
  - If `isMarketing && !isAdmin`: replace the standard nav with only `{ Marketing Dashboard, Profile, Settings }` and hide everything else (Health Check, Medicine, Appointments, etc.).
  - If `isAdmin`: keep current admin link AND add a Marketing Dashboard link.
- Hide sidebar on `/marketing-dashboard` same way it's hidden on `/admin-dashboard` (`isAdminDashboard` becomes `isFullScreenDashboard`).

## 5. Admin "Team Access" tab
- New component `src/components/admin/TeamAccessManagement.tsx`:
  - Search input (email or name) → query `profiles` joined with auth email via existing pattern (or just by email through `get_user_by_phone`-style RPC; simplest: search `profiles` by name and show email from a small RPC `get_user_email(uuid)` — OR use existing admin patterns already in repo for user lookup).
  - List current marketing members (join `user_roles` where role='marketing' with profiles).
  - "Grant marketing access" button → insert into `user_roles`.
  - "Revoke" button → delete from `user_roles`.
- Add the tab to `AdminDashboard.tsx` alongside existing tabs.

## 6. Edge function
- `supabase/functions/broadcast-notification/index.ts`: update authorization to allow marketing role in addition to admin (using service-role client to check `user_roles`).

## Technical notes
- Marketing users never see medicine/health/appointment nav; they land on `/marketing-dashboard` after login. Optional: add a post-login redirect for marketing-only accounts (skip for v1; they can navigate via sidebar).
- All visibility checks use `useUserRole()` — no role data stored client-side.
- No changes to push delivery pipeline; campaigns still flow through the existing `broadcast-notification` edge function.

## Files touched
- New: `src/pages/MarketingDashboard.tsx`, `src/components/admin/TeamAccessManagement.tsx`
- Edited: `src/App.tsx`, `src/components/layout/MainLayout.tsx`, `src/hooks/useUserRole.ts`, `src/pages/AdminDashboard.tsx`, `supabase/functions/broadcast-notification/index.ts`
- Migration: enum value + policies for `admin_broadcast_notifications` and `marketing-images` bucket.
