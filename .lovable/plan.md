

# Remove Book Appointment Button, Make Doctor Card Clickable

## What Changes

**Goal**: Remove the standalone "Book Appointment" button from each doctor card. Instead, clicking anywhere on the card opens the `BookAppointmentDialog`, where users pick from Available Slots or Manual Booking tabs.

## Changes

### 1. `src/pages/Appointments.tsx` (Browse Doctors tab)
- Remove the `<Button>` with "Book Appointment" from each doctor card
- Remove the `<DoctorSlots>` component from inside the card (slots will be shown in the dialog)
- Make the entire `<Card>` clickable with `onClick={() => handleBookAppointment(doctor)}` and add `cursor-pointer hover:shadow-lg` styles

### 2. `src/components/appointments/NearbyDoctorsView.tsx` (Nearby tab)
- Same changes: remove the "Book Now" button and `<DoctorSlots>` from each card
- Make the `<Card>` clickable to open `BookAppointmentDialog`

### 3. No changes to `BookAppointmentDialog.tsx`
- It already has both "Available Slots" and "Manual Booking" tabs built in — those will remain the slot selection UI once a card is clicked.

## Result
User sees doctor cards with info only → clicks a card → dialog opens with Available Slots / Manual Booking tabs → selects slot → books appointment.

