

# Plan: Two-Section Booking UI (Available Slots + Manual Booking)

## What Changes

Update the date/time selection area in `BookAppointmentDialog.tsx` to show two clearly labeled sections using Tabs when a doctor has available slots:

### Section 1: "Available Slots" (default when slots exist)
- Shows doctor-created slots grouped by date as clickable chips/buttons
- Selecting a slot auto-fills both date and time
- Visual: date headers with time slot buttons beneath

### Section 2: "Manual Booking"  
- The existing calendar date picker + generic fallback time slot dropdown
- Always available regardless of whether doctor has slots

### When doctor has NO slots
- Skip the tabs entirely, show only the Manual Booking UI (current fallback behavior)

## Implementation

**File: `src/components/appointments/BookAppointmentDialog.tsx`**

1. Add a `bookingMode` state: `'available' | 'manual'` (default `'available'` when slots exist, `'manual'` otherwise)

2. Replace lines 390-458 (the current date/time grid) with:
   - A `Tabs` component with two tabs: "Available Slots" and "Manual Booking"
   - **Available Slots tab**: render `doctorSlots` grouped by date, each date as a header, time slots as small buttons. Clicking a slot sets `date` and `formData.time` directly. Highlight the selected slot.
   - **Manual Booking tab**: the existing Calendar popover + fallback time dropdown (always uses `fallbackTimeSlots`, calendar allows any future date)

3. Remove the `useDoctorSlots` logic that restricts calendar dates — the calendar in Manual mode should allow any future date. The Available Slots tab handles doctor-specific slots separately.

4. Keep all other logic (payment, submission, health check data) unchanged.

