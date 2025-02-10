import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: Request) {
  try {
    const { requestId, newStatus, amount, userEmail } = await request.json();

    // Skip sending email if required data is missing
    if (!userEmail || !requestId || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const getEtaMessage = (status: string) => {
      switch (status.toLowerCase()) {
        case "in progress":
          return "<p>Your request is now being reviewed. You can expect a decision (approval or rejection) within 1 business day.</p>";
        case "submitted":
          return '<p>Your request will be reviewed soon. Requests typically move to "In Progress" within 2-3 business days.</p>';
        case "approved":
        case "rejected":
          return "<p>This is the final status for your request.</p>";
        default:
          return "";
      }
    };

    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: `Payment Request Status Update - ${newStatus}`,
      html: `
        <h2>Payment Request Status Update</h2>
        <p>Your payment request (ID: ${requestId}) has been updated:</p>
        <ul>
          <li><strong>New Status:</strong> ${newStatus}</li>
          ${
            amount
              ? `<li><strong>Amount:</strong> $${Number(amount).toFixed(
                  2
                )} CAD</li>`
              : ""
          }
        </ul>
        ${getEtaMessage(newStatus)}
        <p>If you have any questions, please contact your club administrator.</p>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email notification" },
      { status: 500 }
    );
  }
}
