import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SubmitButton from "./SubmitButton";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const username = user.email.split("@")[0];

  const { data: paymentRequests, error } = await supabase
    .from("payment_requests")
    .select("*, groups(name)")
    .order("timestamp", { ascending: true }) 
    .eq("user_id", user.id);

  console.log(paymentRequests);
  if (error) {
    console.error("Error fetching payment requests:", error);
    return <div>Error loading payment requests.</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold">Welcome, {username}</h1>
          <form action="/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-8 bg-white p-10 rounded-lg shadow-lg w-full max-w-5xl h-full sm:h-auto">
          <h2 className="text-2xl font-semibold text-gray-800">Your Dashboard</h2>
          <p className="text-gray-600"></p>
          
          {/* Payment Requests Table */}
          <div className="w-full overflow-x-auto">
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
                {paymentRequests && paymentRequests.length > 0 ? (
                  paymentRequests.map((request) => (
                    <tr key={request.request_id}>
                      <td className="py-2 px-4 border-b border-gray-200">{request.full_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.who_are_you}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.amount_requested_cad}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.groups?.name || "Unknown Group"}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.payment_timeframe}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.reimbursement_or_payment}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{new Date(request.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.status}</td>
                    </tr>
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

          {/* Submit a Request Button */}
          <a href="/forms" className="w-full">
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors w-full"
            >
              Submit a new request
            </button>
          </a>

        </div>
      </main>
    </div>
  );
}