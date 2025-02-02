import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import EditableStatusRow from "./EditableStatusRow";

export default async function ClubAdminDashboard() {
  const supabase = await createClient();

  // Check user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user role and club name
  const { data: userRole, error: roleError } = await supabase
    .from("users")
    .select("role, group_name")
    .eq("id", user.id)
    .single();

  if (roleError || !userRole || userRole.role !== "club_admin") {
    console.error("Access denied: User is not a Club Admin");
    redirect("/dashboard/user"); // Redirect unauthorized users
  }

  const { group_name } = userRole;
  const username = user.email.split("@")[0];

  // Fetch reimbursement requests for the Club Admin's specific club
  const { data: paymentRequests, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("group_or_team_name", group_name)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching payment requests:", error);
    return <div>Error loading payment requests.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            Club Admin Dashboard - {group_name}
          </h1>
          <form action="/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center bg-gray-100 p-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Reimbursement Requests for {group_name}
        </h2>

        <div className="w-full overflow-x-auto mb-10">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">
                  Full Name
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">
                  Amount Requested (CAD)
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">
                  Payment Timeframe
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.length > 0 ? (
                paymentRequests.map((request) => (
                  <EditableStatusRow key={request.request_id} request={request} />
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-600">
                    No payment requests found for {group_name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
