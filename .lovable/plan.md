

## Plan: Two Coming Soon Pages + Redirects + Hide Doctor Registration

### What will change

1. **Create two new Coming Soon pages**:
   - `src/pages/MedicineComingSoon.tsx` — themed for medicine delivery (pill/package icon, medicine-related messaging)
   - `src/pages/AppointmentsComingSoon.tsx` — themed for doctor appointments (calendar/stethoscope icon, appointment-related messaging)

2. **Redirect users to Coming Soon pages**:
   - In `src/App.tsx`: Change the `/medicine` route to render `MedicineComingSoon` instead of `Medicine`, and `/appointments` route to render `AppointmentsComingSoon` instead of `Appointments`
   - Dashboard "Book Appointment" and "Order Medicines" buttons will naturally redirect to these Coming Soon pages since they use `navigate('/appointments')` and `navigate('/medicine')` already

3. **Hide Doctor Registration from sidebar navigation**:
   - In `src/components/layout/MainLayout.tsx`: Remove the `else` block (lines 79-81) that adds "Doctor Registration" for regular users. Only show doctor-related nav items for users who already have the doctor role or have a pending application.

### Technical details

**New files:**
- `src/pages/MedicineComingSoon.tsx` — Similar to existing `ComingSoon.tsx` but with medicine-specific icon (Pill), title, description about medicine delivery service, and a "Book Appointment Instead" CTA redirecting to `/dashboard`
- `src/pages/AppointmentsComingSoon.tsx` — Similar structure with appointment-specific icon (Calendar/Stethoscope), description about appointment booking, and a "Order Medicine Instead" CTA redirecting to `/dashboard`

**Modified files:**
- `src/App.tsx` — Import and swap route components for `/medicine` and `/appointments`
- `src/components/layout/MainLayout.tsx` — Remove lines 79-81 (the `else` block adding "Doctor Registration" nav item for regular users)

### Impact
- Patients see Coming Soon when clicking Appointments or Medicine
- Doctor Registration link removed from sidebar for all regular users
- Existing doctor/pharmacy/admin access is unaffected
- Dashboard quick action buttons will land on the Coming Soon pages naturally

