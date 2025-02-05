"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import EditableStatusRow from "@/components/dashboard/EditableStatusRow";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";

export default function ClubAdminDashboard() {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      // Check user authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Fetch user role and group ID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, group_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData || userData.role !== "club_admin") {
        console.error("Access denied: User is not a Club Admin");
        window.location.href = "/dashboard/user";
        return;
      }

      const groupId = userData.group_id;

      // Fetch reimbursement requests for the Club Admin's group
      const { data: requests, error: requestsError } = await supabase
        .from("payment_requests")
        .select("*, groups(name)")
        .eq("group_id", groupId)
        .order("timestamp", { ascending: true });

      if (requestsError) {
        console.error("Error fetching payment requests:", requestsError);
      } else {
        setPaymentRequests(requests);
      }
      
      setLoading(false);
    }

    fetchData();
  }, []);

  const updatePaymentRequestStatus = (requestId, newStatus) => {
    setPaymentRequests(currentRequests =>
      currentRequests.map(request =>
        request.request_id === requestId
          ? { ...request, status: newStatus }
          : request
      )
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold">Club Admin Dashboard</h1>
          <form action="/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center bg-gray-100 p-10">
        {/* Analytics Dashboard */}
        <DashboardAnalytics paymentRequests={paymentRequests} />

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Reimbursement Requests
        </h2>

        <div className="w-full overflow-x-auto mb-10">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Full Name</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Who Are You</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Amount Requested (CAD)</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Group Name</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Payment Timeframe</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Reimbursement or Payment</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Timestamp</th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentRequests.length > 0 ? (
                paymentRequests.map((request) => (
                  <EditableStatusRow 
                    key={request.request_id} 
                    request={request}
                    onStatusUpdate={updatePaymentRequestStatus}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-gray-600">
                    No payment requests found.
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