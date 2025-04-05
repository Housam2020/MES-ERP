# MES-ERP: McMaster Engineering Society Expense Reporting Platform

MES-ERP is a custom web application designed to streamline financial operations, primarily reimbursement and budget management, for the McMaster Engineering Society (MES) and its approximately 60 associated student groups. It replaces inefficient manual processes involving spreadsheets and forms with a modern, centralized platform.

## Key Features

*   **Reimbursement & Payment Requests:** Intuitive forms for submitting requests, including receipt uploads with optional OCR processing.
*   **Status Tracking:** Users can track the status of their submitted requests (Pending, Approved, Rejected, Reimbursed).
*   **Role-Based Access Control (RBAC):** Granular permissions system allowing users to belong to multiple groups with different roles, ensuring appropriate data access.
*   **Budget Management:** Interface for administrators to define and manage operating budgets for groups. Clubs can submit annual budget requests.
*   **Approval Workflows:** Enables authorized administrators to review and approve/reject requests.
*   **Automated Notifications:** Email (and potentially SMS) notifications for request status updates.
*   **User, Role & Group Management:** Interfaces for administrators to manage system users, define roles/permissions, and manage club/group entities.
*   **Analytics Dashboard:** Visualizations for tracking spending trends, request volume, status distributions, and budget utilization.
*   **Audit Trails:** Implicit logging of key actions for compliance and transparency.

## Technology Stack

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
*   **UI Components:** Shadcn UI
*   **Styling:** Tailwind CSS
*   **Testing:** Jest, React Testing Library
*   **Notifications:** SendGrid (Email), Twilio (SMS - planned)
*   **OCR:** Tesseract.js
*   **CI/CD:** GitHub Actions

## Live Application Access

The production application is hosted on Vercel and can be accessed here:

**[https://mes-erp.vercel.app/login](https://mes-erp.vercel.app/login)**

Users require an account to log in. New users can register via the application.

## Getting Started (Local Development)

To run the project locally for development or contribution:

**Prerequisites:**

*   Node.js (v18 or later recommended)
*   npm (or yarn)
*   Git

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Housam2020/MES-ERP.git
    cd MES-ERP/src
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up environment variables:**
    *   Copy the example environment file: `cp .env.local.example .env.local` (Create `.env.local.example` if it doesn't exist)
    *   Fill in the required environment variables in `.env.local`, especially Supabase URL and Anon Key:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        # Add other keys if needed (SendGrid, Twilio)
        SENDGRID_API_KEY=YOUR_SENDGRID_KEY
        SENDGRID_FROM_EMAIL=your_verified_sendgrid_email@example.com
        # TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
        # TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
        # TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
        ```
    *   You will need a Supabase project set up with the corresponding database schema (see `src/docs/DATABASE.md`).

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

Comprehensive documentation is available in the `/docs` directory of the main repository, including:

*   Software Requirements Specification (`docs/SRS-Volere/SRS.tex`)
*   Module Guide (`docs/Design/SoftArchitecture/MG.tex`)
*   Module Interface Specification (`docs/Design/SoftDetailedDes/MIS.tex`)
*   Verification & Validation Plan/Report (`docs/VnVPlan/`, `docs/VnVReport/`)
*   Hazard Analysis (`docs/HazardAnalysis/`)
*   User Guide (`docs/UserGuide/UserGuide.tex`)

Technical documentation can also be found within the `src` directory:

*   Database Schema (`src/docs/DATABASE.md`)
*   Authentication System (`src/docs/AUTH.md`)

## Contributing

Please refer to the project's contribution guidelines (if available - see `CONTRIBUTING.md` in root). Contributions typically involve creating feature branches, submitting pull requests, and ensuring code passes CI checks (linting, testing).

## License

This project uses a proprietary license. See the [LICENSE](LICENSE) file in the root directory for details.