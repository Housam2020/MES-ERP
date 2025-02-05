"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import ClubAdminHeader from "@/components/dashboard/ClubAdminHeader";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";

export default function ClubAnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
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
        router.push("/dashboard/user");
        return;
      }

      const groupId = userData.group_id;

      // Fetch payment requests for the Club Admin's group
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <ClubAdminHeader />
      
      <main className="container mx-auto px-4 py-8">
        <DashboardAnalytics paymentRequests={paymentRequests} />
      </main>
    </div>
  );
}
