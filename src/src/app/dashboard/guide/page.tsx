"use client";

// import { useRouter } from "next/navigation"; // No longer needed
// import { ScrollArea } from "@/components/ui/scroll-area"; // No longer needed
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Footer from "@/components/dashboard/Footer"; // Import Footer

export default function GuidesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <DashboardHeader /> {/* Add the standard header */}
      {/* Main Content Area */}
      <main className="container mx-auto p-6 flex-1">
        {" "}
        {/* Use standard container */}
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
          User Guide
        </h1>
        {/* Guide Content Area - Removed ScrollArea */}
        {/* Added padding, background, rounded corners, and shadow directly to this div */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="prose dark:prose-invert max-w-none">
            {" "}
            {/* Basic prose styling */}
            <h2 className="text-xl font-semibold mb-4">
              Welcome to the Platform!
            </h2>
            <p className="mb-6">
              This guide provides instructions on how to use the financial
              management platform based on your assigned role.
            </p>
            {/* Guide for Regular Users */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                Guide for Regular Users
              </h3>
              <p className="mb-3">
                As a regular user, your primary interactions involve submitting
                requests and managing your account information.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Logging In:</strong> Access the platform using your
                  credentials via the login page.
                </li>
                <li>
                  <strong>Dashboard:</strong> Upon login, you&apos;ll see your
                  dashboard (`/dashboard/home`). This page displays statistics
                  relevant only to you, such as the number of payment requests
                  you&apos;ve submitted and their total amount.
                </li>
                <li>
                  <strong>Submitting a Reimbursement Request:</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      Navigate to the &quot;Forms&quot; page from the sidebar or
                      directly via (`/forms`).
                    </li>
                    <li>
                      Fill out the reimbursement form with all required details
                      (payee, amount, description, etc.).
                    </li>
                    <li>
                      Ensure you select the correct `Group` this request belongs
                      to from the dropdown.
                    </li>
                    <li>
                      Click &quot;Submit&quot;. You should receive a
                      confirmation alert, and you&apos;ll be redirected to your
                      dashboard.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Tracking Your Requests:</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      Go to the &quot;Requests&quot; page
                      (`/dashboard/requests`).
                    </li>
                    <li>
                      Here, you will see a table listing only *your* submitted
                      payment requests and their current status (e.g.,
                      Submitted, In Progress, Approved, Rejected). Budget
                      requests submitted by others are not visible here unless
                      you have higher permissions.
                    </li>
                    <li>
                      You will receive an email notification when the status of
                      your *payment* request is updated. Emails include details
                      like the new status and potentially the amount.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Managing Your Account Info:</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      Navigate to the &quot;Account Info&quot; page
                      (`/dashboard/accountInfo`) from the sidebar or user menu.
                    </li>
                    <li>
                      Here you can view your profile details like name, email,
                      and phone number.
                    </li>
                    <li>
                      Some fields (like phone number or payment preference) may
                      be editable. Click the pencil icon to edit, make changes,
                      and then click the checkmark to save or the X to cancel.
                      Fields like email address or assigned role are typically
                      not editable by regular users.
                    </li>
                  </ul>
                </li>
              </ul>
            </section>
            {/* Guide for Club/Group Admins */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                Guide for Club/Group Admins
              </h3>
              <p className="mb-3">
                As a Club Admin, you have additional capabilities for managing
                requests, members, and potentially roles within your specific
                group(s), alongside the standard user actions. Your exact
                abilities depend on the specific permissions assigned to your
                role (e.g., `view_club_requests`, `manage_club_requests`,
                `manage_club_users`, `manage_club_roles`).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Dashboard:</strong> Your dashboard (`/dashboard/home`)
                  may show broader statistics if you have the
                  `view_club_requests` permission. This can include the total
                  number, total amount, and count of pending payment requests
                  specifically for the club(s) you manage, in addition to your
                  personal request stats.
                </li>
                <li>
                  <strong>Viewing Club Requests:</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      Navigate to the &quot;Requests&quot; page
                      (`/dashboard/requests`).
                    </li>
                    <li>
                      The page title (e.g., &quot;Payment Requests for [Club
                      Name(s)]&quot;) or table content will reflect that you are
                      viewing requests associated with the group(s) you have
                      permission to view (`view_club_requests`).
                    </li>
                    <li>
                      Use the tabs at the top to switch between viewing
                      &quot;Payment Requests&quot; and &quot;Budget
                      Requests&quot; for your group(s).
                    </li>
                    <li>
                      The tables display requests submitted by members of the
                      group(s) you manage, or requests submitted by others but
                      assigned to your group(s).
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Managing Club Requests (Approval/Rejection):</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      If you have the `manage_club_requests` permission, you
                      will see controls (like status dropdowns) in the status
                      column on the &quot;Requests&quot; page tables for
                      requests belonging to your group(s).
                    </li>
                    <li>
                      Use these controls to update the status (e.g., change from
                      &quot;Submitted&quot; to &quot;Approved&quot; or
                      &quot;Rejected&quot;). A confirmation alert usually
                      appears after a successful update.
                    </li>
                    <li>
                      Updating the status of a *payment request* triggers an
                      email notification to the user who submitted it. Budget
                      request status changes currently do not trigger emails.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Submitting Requests:</strong> Follow the same process
                  as regular users (via `/forms` for payment requests or
                  potentially `/dashboard/annual_form` for budget requests),
                  ensuring you select the appropriate group your request belongs
                  to.
                </li>
                <li>
                  <strong>Submitting Annual Budget Form:</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      If you have permissions like `create_budget_requests`, you
                      may need to submit an annual budget for your club.
                    </li>
                    <li>
                      Navigate to the &quot;Annual Budget Form&quot; page
                      (`/dashboard/annual_form`).
                    </li>
                    <li>
                      Fill out the form detailing projected income and expenses
                      for the specified budget year, selecting your club name.
                    </li>
                    <li>Submit the form for review.</li>
                  </ul>
                </li>
                <li>
                  <strong>Managing Club Members/Roles (Optional):</strong>
                  <ul className="list-circle pl-5 mt-2 space-y-1">
                    <li>
                      If you have `manage_club_users` permission, you can visit
                      the &quot;Users&quot; page (`/dashboard/users`). Here you
                      can view users within your group(s) and potentially add or
                      remove users *from your specific group(s)*. You cannot
                      manage users in other groups.
                    </li>
                    <li>
                      If you have `manage_club_roles` permission, you can visit
                      the &quot;Roles&quot; page (`/dashboard/roles`). Here you
                      can view, create, or modify roles that are specifically
                      assigned *to your group(s)*. You typically cannot create
                      or assign roles with high-level administrative
                      permissions.
                    </li>
                    <li>
                      On the &quot;Users&quot; page, you might also be able to
                      assign the group-specific roles (that you can manage) to
                      users within your group.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Managing Your Account Info:</strong> Same process as
                  regular users via `/dashboard/accountInfo`.
                </li>
              </ul>
            </section>
            {/* Guide for System Admins */}
            <section>
              <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                Guide for System Admins
              </h3>
              <p className="mb-3">
                As a System Admin (typically requiring permissions like
                `manage_all_users`, `manage_all_roles`, `manage_groups`,
                `view_all_requests`), you have broad access across the platform.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Dashboard:</strong> Your dashboard (`/dashboard/home`)
                  provides a system-wide overview. If you have
                  `view_all_requests`, you'll see statistics for *all* payment
                  requests across *all* groups (total count, total amount,
                  pending count). If you have `manage_all_users` or similar, you
                  may also see the total number of users in the system.
                </li>
                <li>
                  <strong>Full Access:</strong> You can generally navigate to
                  and utilize all pages available in the sidebar, including
                  those for managing core system settings.
                </li>
                <li>
                  <strong>Managing Users:</strong> Go to the &quot;Users&quot;
                  page (`/dashboard/users`). You can view, add, remove, and
                  modify *any* user in the system. This includes assigning users
                  to any group and granting them any role (including global
                  administrative roles).
                </li>
                <li>
                  <strong>Managing Roles & Permissions:</strong> Go to the
                  &quot;Roles&quot; page (`/dashboard/roles`). You can create,
                  edit, and delete *any* role, whether it's global or assigned
                  to specific groups. You define which permissions (including
                  protected admin permissions) are associated with each role.
                </li>
                <li>
                  <strong>Managing Groups:</strong> Go to the &quot;Groups&quot;
                  page (`/dashboard/groups`). You can create new groups
                  (clubs/organizations), edit their names, and delete them
                  (often with restrictions, e.g., cannot delete if users or
                  roles are assigned).
                </li>
                <li>
                  <strong>Viewing & Managing All Requests:</strong> The
                  &quot;Requests&quot; page (`/dashboard/requests`) shows *all*
                  payment and budget requests from *all* users and groups if you
                  have `view_all_requests`. With `manage_all_requests` (or
                  similar), you have the authority to update the status
                  (approve/reject) for *any* request. Status updates on payment
                  requests trigger email notifications.
                </li>
                <li>
                  <strong>Operating Budget Management:</strong> The
                  &quot;Operating Budget&quot; page
                  (`/dashboard/operating_budget`) likely allows for detailed
                  management of group budgets across different years, including
                  adding/editing budget line items, groups, and viewing
                  financial allocations and changes. Requires appropriate
                  permissions.
                </li>
                <li>
                  <strong>Analytics:</strong> Visit the &quot;Analytics&quot;
                  page (`/dashboard/analytics`). If you have
                  `view_all_requests`, you can view aggregated data, trends, and
                  reports covering the entire system's financial activities,
                  such as spending trends, status distributions, and budget
                  utilization across all groups.
                </li>
                <li>
                  <strong>Managing Your Account Info:</strong> Same process as
                  regular users via `/dashboard/accountInfo`.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer /> {/* Add the standard footer */}
    </div>
    /* Old Card Layout Removed
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[85vh] min-h-[600px] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            User Guide
          </h1>
          <button
            onClick={() => router.push("/dashboard/home")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Go to Home"
          >
            <HomeIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>
        <ScrollArea className="flex-1 p-6">
          ... content ...
        </ScrollArea>
      </div>
    </div>
    */
  );
}
