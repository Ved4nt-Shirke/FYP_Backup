# Palette Popup Modal - Testing Guide

## How to Test the Palette Popup

### Steps to Reproduce:

1. **Login as Super Admin** - Navigate to Super Admin > Manage Institutions
2. **Select an Institution** - Click on an institution to manage it
3. **Click "Edit Palette" Button** - In the "Update Color Palette" section, click the "Edit Palette" button
4. **Verify Modal Opens** - A modal should appear with:
   - Title: "Edit Color Palette"
   - Palette selection grid with 12+ palette options (blue, navy, indigo, sky, cyan, emerald, forest, teal, amber, orange, red, slate)
   - Security verification section with fields:
     - Superadmin Password (text input)
     - Confirmation (text input that requires "CONFIRM")
   - Cancel and Save Palette buttons

### What Should Work:

✅ **Palette Selection**

- Click any palette button to select it
- Selected palette should have a thicker border and glow effect
- Hover over unselected palettes should highlight them

✅ **Security Verification**

- Type superadmin password in the password field
- Type "CONFIRM" in the confirmation field

✅ **Modal Interaction**

- Click "Save Palette" to submit and update the palette
- Click "Cancel" to close without saving
- Click the X button in the top-right to close
- Click outside the modal (on the dark backdrop) to close

✅ **Feedback**

- Success message should appear after palette is updated
- Admin UI should update the color scheme
- Error messages if password is incorrect

### Debugging:

If the modal doesn't work:

1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify the modal is rendering by inspecting the DOM
4. Check if palette buttons are clickable
5. Verify form inputs accept text

### Expected Behavior After Saving:

- Modal closes automatically
- Palette summary on the main page updates to show new palette name
- Admin UI colors change to reflect the new palette
- Page can be refreshed and the new palette should persist
