import { NextResponse } from "next/server";
import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate environment variables
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Twilio environment variables are not set.");
  // Optionally throw an error or handle appropriately
}

const client = twilio(accountSid, authToken);

export async function POST(request: Request) {
  try {
    const { phoneNumber, requestId, newStatus, amount } = await request.json();

    // Basic validation
    if (!phoneNumber || !requestId || !newStatus) {
      return NextResponse.json(
        {
          error: "Missing required fields (phoneNumber, requestId, newStatus)",
        },
        { status: 400 }
      );
    }

    // Format phone number (ensure E.164 format if needed, e.g., +1XXXXXXXXXX)
    // Basic example: assumes US/Canada format if no '+' prefix
    const formattedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+1${phoneNumber.replace(/\D/g, "")}`;

    // Construct the message body
    let messageBody = `Payment Request Update (ID: ${requestId}): Status changed to ${newStatus}.`;
    if (amount) {
      messageBody += ` Amount: $${Number(amount).toFixed(2)} CAD.`;
    }
    // Add ETA message similar to email if desired
    // messageBody += ` ETA: ...`;

    // Send the SMS
    await client.messages.create({
      body: messageBody,
      from: twilioPhoneNumber!,
      to: formattedPhoneNumber,
    });

    console.log(`SMS sent successfully to ${formattedPhoneNumber}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending SMS via Twilio:", error);

    // Provide more specific error feedback if possible
    let errorMessage = "Failed to send SMS notification";
    if (error.code === 21211) {
      // Example: Twilio error code for invalid 'To' number
      errorMessage = "Invalid phone number provided.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
