# Office Staff Transfer - User Guide

## Quick Start Guide

### How to Transfer Office Staff Between Departments

#### Step 1: Navigate to Office Staff List

```
Admin Panel → Office Staff → Staff List View
```

#### Step 2: Locate the Staff Member

- Use search to find staff member by name, email, or employee ID
- Or scroll through the list (card or table view)

#### Step 3: Click Transfer Button

**In Card View:**

```
┌─────────────────────────────┐
│ 🔑 🔄 ✏️ 🗑️                │ ← Click the 🔄 button
│                             │
│ John Doe                    │
│ OFF202601                   │
│ ✉️ john.doe@college.edu     │
│ 🏢 Computer Science         │
│ Active                      │
└─────────────────────────────┘
```

**In Table View:**

```
Actions: [🔑] [🔄] [✏️] [🗑️]  ← Click the 🔄 button
```

#### Step 4: Transfer Modal Opens

```
┌─────────────────────────────────────────────────┐
│ 🔄 Transfer Office Staff                    [✕] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [👤]  John Doe                                 │
│        OFF202601                                │
│                                                 │
│  ┌────────────────┐    →    ┌────────────────┐ │
│  │ Current Dept   │         │  Transfer To   │ │
│  │                │         │                │ │
│  │ 🏢 Computer    │    →    │  [Dropdown]   │ │
│  │    Science     │         │  Select...     │ │
│  └────────────────┘         └────────────────┘ │
│                                                 │
│  ℹ️ Select a department to transfer              │
│                                                 │
├─────────────────────────────────────────────────┤
│           [Cancel]  [Confirm Transfer]          │
└─────────────────────────────────────────────────┘
```

#### Step 5: Select Target Department

Click the dropdown menu and choose:

- **A Different Department** → To transfer
- **"Unassign from Department"** → To remove assignment

#### Step 6: Review Transfer

The modal shows different messages based on your selection:

**Assigning to Department (Blue Info):**

```
ℹ️ This staff member is not currently assigned to any department.
   Select a department to assign them.
```

**Transferring Between Departments (Green Success):**

```
✓ Transfer from Computer Science to Mechanical Engineering
```

**Removing from Department (Orange Warning):**

```
⚠️ This will remove the staff member from Computer Science.
```

#### Step 7: Confirm Transfer

Click **"Confirm Transfer"** button

#### Step 8: Transfer Complete!

```
✓ Office staff transferred successfully
```

The list automatically refreshes showing the updated department.

---

## Common Transfer Scenarios

### Scenario 1: New Staff Assignment

**Situation:** Staff member hired but not yet assigned to department

**Steps:**

1. Click Transfer button on unassigned staff
2. Current Department shows: "Not Assigned"
3. Select target department from dropdown
4. Info message: "Select a department to assign them"
5. Click "Confirm Transfer"
6. Done! ✓

### Scenario 2: Department Change

**Situation:** Staff needs to move from one department to another

**Steps:**

1. Click Transfer button on staff member
2. Current Department shows their current assignment
3. Select new department from dropdown
4. Success message: "Transfer from [Old] to [New]"
5. Click "Confirm Transfer"
6. Done! ✓

### Scenario 3: Remove from Department

**Situation:** Staff becomes general/unassigned

**Steps:**

1. Click Transfer button on staff member
2. Current Department shows their current assignment
3. Select "Unassign from Department" option
4. Warning message: "This will remove the staff member from [Dept]"
5. Click "Confirm Transfer"
6. Done! ✓

---

## Transfer Button Locations

### Card View

The transfer button is located in the top-right action bar:

```
Position: 2nd button from left
Icon: 🔄 (arrows left-right)
Color: Blue (primary accent)
```

### Table View

The transfer button is in the Actions column:

```
Position: 2nd button from left
Icon: 🔄 (arrows left-right)
Color: Blue (primary accent)
Label: "Transfer Department"
```

---

## Button Icons Guide

| Button       | Icon   | Action                  | Color    |
| ------------ | ------ | ----------------------- | -------- |
| Credentials  | 🔑     | View/edit login details | Default  |
| **Transfer** | **🔄** | **Transfer department** | **Blue** |
| Edit         | ✏️     | Edit full profile       | Default  |
| Delete       | 🗑️     | Remove staff member     | Red      |

---

## Keyboard Shortcuts

When Transfer Modal is Open:

- **Esc** → Close modal (same as Cancel)
- **Tab** → Navigate between elements
- **Enter** → Confirm transfer (when focused on button)

---

## Tips & Best Practices

### ✅ DO:

- Review the current department before transferring
- Read the transfer note message for confirmation
- Use search to quickly find staff members
- Check the department dropdown carefully before confirming

### ❌ DON'T:

- Don't select the same department (button will be disabled)
- Don't close browser during transfer (wait for success message)
- Don't transfer without checking current assignment

---

## Troubleshooting

### Problem: Transfer button disabled

**Solution:** Staff member may be in read-only mode. Check your admin permissions.

### Problem: Department list empty

**Solution:** No departments created yet. Add departments first in Department Management.

### Problem: Transfer fails with error

**Possible Causes:**

- Network connection issue
- Department was deleted during transfer
- Permission issue

**Solution:**

1. Check your internet connection
2. Refresh the page
3. Try again
4. Contact system administrator if issue persists

### Problem: Changes not showing

**Solution:** Click the refresh icon or reload the page. The list should auto-refresh after transfer.

---

## FAQ

**Q: Can I transfer multiple staff at once?**  
A: Not currently. Each staff member must be transferred individually.

**Q: What happens to staff data during transfer?**  
A: Only the department assignment changes. All other data (name, email, credentials, etc.) remains unchanged.

**Q: Can I undo a transfer?**  
A: Yes! Just transfer them back to the previous department.

**Q: Will staff be notified of the transfer?**  
A: No automatic notification. You should inform staff members separately.

**Q: Does transfer affect login credentials?**  
A: No. Username and password remain the same after transfer.

**Q: Can I transfer to multiple departments?**  
A: No. Each staff member can only be assigned to one department at a time (or none).

**Q: What if the department is deleted?**  
A: Staff members in that department become unassigned.

---

## Mobile Usage

### On Tablets (768px - 1024px):

- Transfer modal remains full-featured
- Department boxes stack vertically
- Transfer arrow rotates 90°

### On Phones (< 768px):

- Use table view for easier button access
- Transfer modal adapts to screen size
- Scroll within modal if needed
- All functionality preserved

---

## Related Features

After transferring, you can also:

- **Edit Profile** → Change other staff details
- **View Credentials** → See/update login information
- **Delete Staff** → Remove from system (requires password)

---

**For additional help, contact your system administrator.**

---

**Last Updated**: February 13, 2026  
**Feature Version**: 1.0
