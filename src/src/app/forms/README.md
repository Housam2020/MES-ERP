# Reimbursement Forms

This README documents the reimbursement forms system that allows users to submit payment and reimbursement requests.

## Overview

The reimbursement form system enables users to submit payment requests linked to their groups. The form includes features like receipt OCR processing, dynamic form sections, and multi-group support.

## File Structure

```
app/forms/
├── README.md       # This documentation
└── page.js         # Main reimbursement form page

components/reimbursement/
├── index.js                        # Exports all reimbursement components
├── ReimbursementForm.jsx           # Main container component
├── ReimbursementFormContext.js     # Shared state context provider
├── BasicInfoSection.js             # Basic information and group selection
├── RoleBudgetSection.js            # Role and budget line selection
├── PaymentDetailsSection.js        # Payment details and amount
└── AdditionalSections.js           # Other form sections (approval, team info, etc.)
```

## Component Structure

The form uses a modular component architecture with React Context for state management:

1. **Main Container**:
   - `ReimbursementForm.jsx`: Main form container with form sections and submission logic

2. **Context Provider**:
   - `ReimbursementFormContext.js`: Manages form state, user groups, and file uploads

3. **Form Sections**:
   - `BasicInfoSection.js`: User details, group selection, and receipt upload
   - `RoleBudgetSection.js`: Role and budget line selection
   - `PaymentDetailsSection.js`: Payment details, amount, and currency
   - `AdditionalSections.js`: Contains ApprovalInfoSection, TeamInfoSection, and PaymentMethodDetailsSection

## Key Features

- **Multi-Group Support**: Users can select which group to submit the request for
- **OCR Receipt Processing**: Automatically extracts totals from receipt images
- **Dynamic Form Fields**: Shows/hides fields based on previous selections
- **Auto-filled User Info**: Pre-populates user details from database
- **Step-by-Step Layout**: Organized, sectioned form for better UX
- **Context-Based State**: Shared state management using React Context

## Implementation Details

### Group Selection

The form fetches user's groups from the user_roles junction table:

```javascript
// Fetch user's groups through junction table
const { data: userRolesData, error: groupsError } = await supabase
  .from("user_roles")
  .select("group_id, groups(id, name)")
  .eq("user_id", user.id)
  .not("group_id", "is", null);

// Extract unique groups
const groups = userRolesData
  ? userRolesData
      .filter(item => item.groups) // Filter out any null groups
      .map(item => item.groups)
      .filter((group, index, self) => 
        index === self.findIndex(g => g.id === group.id)
      )
  : [];

setUserGroups(groups);
```

### OCR Receipt Processing

The form uses Tesseract.js for OCR processing of receipts:

```javascript
const extractTextFromReceipt = (file) => {
  if (!file) return;
  setIsProcessing(true);
  Tesseract.recognize(file, "eng", {
    logger: (m) => console.log(m),
  })
    .then(({ data: { text } }) => {
      console.log("Extracted text:", text);
      setExtractedText(text);
      const computedTotal = extractTotalPriceFromText(text);
      if (computedTotal !== null) {
        setValue("amount_requested_cad", computedTotal);
      }
      setIsProcessing(false);
    })
    .catch((error) => {
      console.error("Error processing OCR:", error);
      setIsProcessing(false);
    });
};
```

### Form Submission

The form submission process associates the request with the user and selected group:

```javascript
const onSubmit = async (data) => {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use the selected group from the form
    if (!data.group_id) {
      alert("Please select a group for this request.");
      return;
    }

    const request_id = uuidv4();

    // Create the data object with all form fields
    const newData = {
      request_id,
      user_id: user.id,
      group_id: data.group_id,
      status: "Pending",
      timestamp: new Date().toISOString(),
      ...data,
    };

    // Insert into payment_requests table
    await supabase.from("payment_requests").insert([newData]);
    
    router.push("/dashboard/home");
  } catch (error) {
    console.error("Error submitting form:", error);
  }
};
```

### Dynamic Form Fields

The form shows different fields based on payment method selection:

```jsx
// Example of conditional rendering based on payment method
const preferredPaymentForm = watch("preferred_payment_form");

{preferredPaymentForm === "E-Transfer" && (
  <div className="space-y-4">
    {/* E-transfer specific fields */}
  </div>
)}

{preferredPaymentForm === "Direct Deposit" && (
  <div className="space-y-4">
    {/* Direct deposit specific fields */}
  </div>
)}
```

## Recent Updates

The form was recently updated to:
- Support the new multi-group user structure
- Split the large monolithic component into smaller, focused components
- Add context-based state management for better organization
- Use React Hook Form with better validation
- Add proper error handling for each section
- Fix group selection to work with the user_roles junction table
