import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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
    .from('payment_requests')
    .select('full_name, who_are_you, amount_requested_cad, group_or_team_name, payment_timeframe, reimbursement_or_payment, timestamp')
    .eq('user_id', user.id); 

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
            Welcome, {username}
          </h1>
          <form action="/signout" method="post">
            <button className="rounded-full border border-solid border-white/[.2] transition-colors flex items-center justify-center hover:bg-blue-700 text-sm h-10 px-4">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-8 bg-white p-10 rounded-lg shadow-lg w-full max-w-5xl h-full sm:h-auto">
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">This is your user dashboard where you can view and manage your information.</p>
          
          {/* Payment Requests Table */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Full Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Who Are You</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Amount Requested (CAD)</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Group or Team Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Payment Timeframe</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Reimbursement or Payment</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paymentRequests && paymentRequests.length > 0 ? (
                  paymentRequests.map((request) => (
                    <tr key={request.timestamp}>
                      <td className="py-2 px-4 border-b border-gray-200">{request.full_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.who_are_you}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.amount_requested_cad}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.group_or_team_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.payment_timeframe}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{request.reimbursement_or_payment}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{new Date(request.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-600">
                      No payment requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
