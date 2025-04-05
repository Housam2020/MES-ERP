# Installation Instructions - MES-ERP

## End User Access (Students, Club Leaders, MES Staff)

MES-ERP is a web-based application hosted online. **There is no software installation required for end users.**

1.  **Access the Platform:** Open a modern web browser (Chrome, Firefox, Edge, Safari recommended) and navigate to the application URL:
    **[https://mes-erp.vercel.app/login](https://mes-erp.vercel.app/login)** 

2.  **Account:**
    *   If you have an account, log in using your registered email and password.
    *   If you are a new user, click the "Register" link on the login page to create an account. You may need to verify your email address.

3.  **Usage:** Once logged in, you can use the platform according to the permissions granted to your role. Refer to the User Guide for details on specific features. 

## Developer / Self-Hosting Instructions (Advanced)

This section is intended for developers who wish to run the application locally or deploy their own instance. End users do not need to follow these steps.

**Prerequisites:**

*   Node.js (v18 or later)
*   npm (or yarn)
*   Git
*   A Supabase account and project setup.
*   (Optional) Accounts for SendGrid (email notifications) and Twilio (SMS notifications) if those features are enabled.
*   A Vercel account (or alternative Node.js hosting platform) for deployment.

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Housam2020/MES-ERP.git
    cd MES-ERP/src
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the `src` directory (you can copy `.env.local.example` if it exists).
    *   Add the following required variables:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
        ```
    *   Add optional variables for notification services if used:
        ```env
        SENDGRID_API_KEY=YOUR_SENDGRID_KEY
        SENDGRID_FROM_EMAIL=your_verified_sendgrid_email@example.com
        # TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
        # TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
        # TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
        ```
    *   Ensure your Supabase project has the correct database schema initialized. Refer to `src/docs/DATABASE.md`. You may need to run SQL migration scripts (not included in this snapshot).

4.  **Run Locally (Development):**
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

5.  **Build for Production:**
    ```bash
    npm run build
    ```

6.  **Deploy:**
    *   **Vercel:** Connect your Git repository (GitHub, GitLab, Bitbucket) to Vercel. Configure the environment variables in the Vercel project settings. Vercel will typically build and deploy automatically upon pushes to the main branch.
    *   **Other Platforms:** Follow the platform's specific instructions for deploying a Next.js application (usually involves running `npm run start` after building).

**Uninstall:**

*   **End Users:** There is nothing to uninstall as it is a web application. Simply stop visiting the URL.
*   **Developers:** Delete the cloned repository directory from your local machine. If deployed, follow the hosting provider's instructions to remove the deployment and associated resources (e.g., delete the project on Vercel, shut down the Supabase project if no longer needed).