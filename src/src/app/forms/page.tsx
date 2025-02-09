"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import Tesseract from "tesseract.js";

type FormData = {
  who_are_you: string;
  email_address: string;
  full_name: string;
  contact_phone_number: string;
  role: string;
  budget_line: string;
  approved_individual_or_project_name: string;
  sport_and_team_name: string;
  conference_or_competition_name: string;
  conference_competition_type: string;
  head_delegate: boolean;
  reimbursement_or_payment: string;
  vendor_recipient: string;
  payment_description: string;
  payment_timeframe: string;
  preferred_payment_form: string;
  payment_details: string;
  amount_requested_cad: number;
  additional_payment_info: string;
  reimbursement_payable_to: string;
  total_claimed_amount_cad: number;
  interac_phone_or_email: string;
  confirmation_email_phone_correct: boolean;
  account_type: string;
  institution_no: string;
  transit_no: string;
  account_no: string;
  cheque_delivery_method: string;
  street_number_and_name: string;
  city: string;
  province_state: string;
  country: string;
  postal_code: string;
  // New field now stores a string (e.g., a URL) instead of binary data.
  receipt?: string;
};

const ReimbursementForm: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper function to extract total price using heuristics.
  const extractTotalPriceFromText = (text: string): number | null => {
    // Look for keywords followed by a monetary value.
    const regexKeywords = /(?:Total(?: Amount)?|Grand Total|Amount Due|Balance Due)[^0-9$]*\$?\s*([\d,]+(?:\.\d{2})?)/i;
    const matchKeywords = text.match(regexKeywords);
    if (matchKeywords && matchKeywords[1]) {
      return parseFloat(matchKeywords[1].replace(/,/g, ""));
    }
    // Fallback: extract all currency amounts and choose the maximum.
    const regexAmounts = /\$([\d,]+(?:\.\d{2})?)/g;
    let amounts: number[] = [];
    let match;
    while ((match = regexAmounts.exec(text)) !== null) {
      amounts.push(parseFloat(match[1].replace(/,/g, "")));
    }
    if (amounts.length > 0) {
      return Math.max(...amounts);
    }
    return null;
  };

  // Function to process OCR on the uploaded receipt.
  const extractTextFromReceipt = (file: File) => {
    if (!file) return;
    setIsProcessing(true);
    Tesseract.recognize(file, "eng", {
      logger: (m) => console.log(m),
    })
      .then(({ data: { text } }) => {
        console.log("Extracted text:", text);
        setExtractedText(text);
        const computedTotal = extractTotalPriceFromText(text);
        console.log("Computed Total Price:", computedTotal);
        if (computedTotal !== null) {
          setValue("amount_requested_cad", computedTotal);
        }
        setIsProcessing(false);
      })
      .catch((error) => {
        console.error("Error processing OCR:", error);
        setIsProcessing(false);
      });
  };

  // Auto-fill form fields with user defaults.
  useEffect(() => {
    const fetchUserDefaults = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Error fetching user:", authError);
        return;
      }
      const { data: userData, error } = await supabase
        .from("users")
        .select("email, fullName, phoneNum, reimbursment_or_payment")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Error fetching user defaults:", error);
      } else if (userData) {
        if (userData.email) setValue("email_address", userData.email);
        if (userData.fullName) setValue("full_name", userData.fullName);
        if (userData.phoneNum) setValue("contact_phone_number", userData.phoneNum);
        // If your user's default is stored under "reimbursment_or_payment" in the users table,
        // set it to the field "preferred_reimbursement_method" in the form.
        if (userData.reimbursment_or_payment) {
          setValue("preferred_reimbursement_method", userData.reimbursment_or_payment);
        }
      }
    };

    fetchUserDefaults();
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    const supabase = await createClient();
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Failed to get the logged-in user.");
        throw userError;
      }
      const { data: userData, error: userGroupError } = await supabase
        .from("users")
        .select("group_id")
        .eq("id", user.id)
        .single();
      if (userGroupError || !userData?.group_id) {
        alert("Failed to retrieve your group information.");
        throw userGroupError;
      }
      const group_id = userData.group_id;
      const request_id = uuidv4();

      // Create the new data object. Note that the receipt field is populated
      // via the new text input (if provided) and NOT from the file upload.
      const newData: FormData = {
        request_id,
        user_id: user.id,
        group_id,
        ...data,
      };

      // Removed code that previously set 'receipt' from the uploaded file.

      const { error } = await supabase
        .from("payment_requests")
        .insert([newData]);
      if (error) {
        if (error.code === "23505") {
          alert("A record with this information already exists.");
        } else {
          alert(`Failed to submit the form: ${error.message}`);
        }
        throw error;
      }
      alert("Form submitted successfully");
      window.location.href = "http://localhost:3000/dashboard/home";
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="container mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          MES Payment and Reimbursement Form
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* SECTION 1: Basic Information */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Basic Information</h2>
            <div className="mb-4">
              <label htmlFor="who_are_you" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Who Are You?
              </label>
              <select
                {...register("who_are_you", { required: "Selection is required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Select Option</option>
                <option value="MES Position">MES Position</option>
                <option value="Ratified Club, Team, or Program Society">
                  Ratified Club, Team, or Program Society
                </option>
                <option value="Student Projects and New Club Seed Funding">
                  Student Projects and New Club Seed Funding
                </option>
                <option value="Intramurals Funding">Intramurals Funding</option>
                <option value="Conference/Competition Delegate (Open or Affiliate)">
                  Conference/Competition Delegate (Open or Affiliate)
                </option>
              </select>
              {errors.who_are_you && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.who_are_you.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="email_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                {...register("email_address", { required: "Email is required" })}
                type="email"
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.email_address && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.email_address.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                {...register("full_name", { required: "Full name is required" })}
                type="text"
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.full_name && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.full_name.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="contact_phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact Phone Number
              </label>
              <input
                {...register("contact_phone_number", { required: "Phone number is required" })}
                type="tel"
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.contact_phone_number && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.contact_phone_number.message}</p>
              )}
            </div>
            {/* RECEIPT UPLOAD & OCR */}
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Receipt Upload</h3>
              <label htmlFor="receipt" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
                Please insert an image of your receipt (PDF, JPG, JPEG, PNG accepted):
              </label>
              <input
                id="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="mt-2"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    setReceiptFile(file);
                    setExtractedText("");
                    // Immediately process the file for OCR
                    extractTextFromReceipt(file);
                  }
                }}
              />
              {/* New Text Input for linking the receipt image */}
              <div className="mt-4">
                <label htmlFor="receipt_link" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
                  Link an image to your receipt
                </label>
                <input
                  {...register("receipt")}
                  type="text"
                  id="receipt_link"
                  placeholder="Enter image URL"
                  className="mt-2 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Role & Budget Information */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Role & Budget Information</h2>
            <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                {...register("role", { required: "Role is required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Select role</option>
                <option value="Administrator">Administrator</option>
                <option value="Chief Returning Officer">Chief Returning Officer</option>
                <option value="Community Integration">Community Integration</option>
                <option value="Culture Coordinator(s)">Culture Coordinator(s)</option>
                <option value="Director, Academic Resources">Director, Academic Resources</option>
                <option value="Director, Clubs">Director, Clubs</option>
                <option value="Director, Events">Director, Events</option>
                <option value="Drain Coordinator(s)">Drain Coordinator(s)</option>
                <option value="DW Lounge Coordinator(s)">DW Lounge Coordinator(s)</option>
                <option value="Equity and Inclusion Officer">Equity and Inclusion Officer</option>
                <option value="Fireball Coordinator(s)">Fireball Coordinator(s)</option>
                <option value="Frequency Editor(s)">Frequency Editor(s)</option>
                <option value="Gerald Hatch Centre Student Coordinator(s)">Gerald Hatch Centre Student Coordinator(s)</option>
                <option value="Graphic Designer(s)">Graphic Designer(s)</option>
                <option value="Information Technology Coordinator(s)">Information Technology Coordinator(s)</option>
                <option value="Kennedy Coordinator(s)">Kennedy Coordinator(s)</option>
                <option value="Leadership Development Committee Coordinator(s)">Leadership Development Committee Coordinator(s)</option>
                <option value="macLAB Chair">macLAB Chair</option>
                <option value="Manager, Advancement and Development">Manager, Advancement and Development</option>
                <option value="Manager, Operations">Manager, Operations</option>
                <option value="Mentorship Coordinator(s)">Mentorship Coordinator(s)</option>
                <option value="Office Cleaner">Office Cleaner</option>
                <option value="Photographer/Videographer(s)">Photographer/Videographer(s)</option>
                <option value="Professional Development Coordinator(s)">Professional Development Coordinator(s)</option>
                <option value="Publications Editor">Publications Editor</option>
                <option value="Social Media Coordinator(s)">Social Media Coordinator(s)</option>
                <option value="Sponsorship Coordinator(s)">Sponsorship Coordinator(s)</option>
                <option value="Sports Coordinator(s)">Sports Coordinator(s)</option>
                <option value="Student Projects Coordinator(s)">Student Projects Coordinator(s)</option>
                <option value="Sustainability Coordinator(s)">Sustainability Coordinator(s)</option>
                <option value="Trailer Coordinator(s)">Trailer Coordinator(s)</option>
                <option value="Website Coordinator(s)">Website Coordinator(s)</option>
                <option value="Wellness Coordinator(s)">Wellness Coordinator(s)</option>
                <option value="Program Representative, Bachelor of Technology">
                  Program Representative, Bachelor of Technology
                </option>
                <option value="Program Representative, Chemical Engineering">
                  Program Representative, Chemical Engineering
                </option>
                <option value="Program Representative, Civil Engineering">
                  Program Representative, Civil Engineering
                </option>
                <option value="Program Representative, Computer Science">
                  Program Representative, Computer Science
                </option>
                <option value="Program Representative, Electrical and Computer Engineering">
                  Program Representative, Electrical and Computer Engineering
                </option>
                <option value="Program Representative, Engineering and Management">
                  Program Representative, Engineering and Management
                </option>
                <option value="Program Representative, Engineering and Society">
                  Program Representative, Engineering and Society
                </option>
                <option value="Program Representative, Engineering Physics">
                  Program Representative, Engineering Physics
                </option>
                <option value="Program Representative, Integrated Biomedical Engineering & Health Sciences">
                  Program Representative, Integrated Biomedical Engineering & Health Sciences
                </option>
                <option value="Program Representative, Materials Science and Engineering">
                  Program Representative, Materials Science and Engineering
                </option>
                <option value="Program Representative, Mechanical Engineering">
                  Program Representative, Mechanical Engineering
                </option>
                <option value="Program Representative, Mechatronics Engineering">
                  Program Representative, Mechatronics Engineering
                </option>
                <option value="Program Representative, Software Engineering">
                  Program Representative, Software Engineering
                </option>
                <option value="Vice President, Academic">Vice President, Academic</option>
                <option value="Vice President, Communications">Vice President, Communications</option>
                <option value="Vice President, External Relations">Vice President, External Relations</option>
                <option value="Vice President, Finance">Vice President, Finance</option>
                <option value="Vice President, Internal">Vice President, Internal</option>
                <option value="Vice President, Student Life">Vice President, Student Life</option>
                <option value="President">President</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.role.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="budget_line" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Relevant Budget Line
              </label>
              <select
                {...register("budget_line", { required: "Budget line is required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Select budget line</option>
                <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                <option value="Academic Resources">Academic Resources</option>
                <option value="Accounting Software">Accounting Software</option>
                <option value="Advertising">Advertising</option>
                <option value="Audit">Audit</option>
                <option value="Awards">Awards</option>
                <option value="B2S Week">B2S Week</option>
                <option value="Bank Fees">Bank Fees</option>
                <option value="Bookkeeper">Bookkeeper</option>
                <option value="Capstone Fund">Capstone Fund</option>
                <option value="CFES Membership">CFES Membership</option>
                <option value="CFES Presidents' Meeting">CFES Presidents' Meeting</option>
                <option value="Closed Conferences & Competitions">Closed Conferences & Competitions</option>
                <option value="Clubfest">Clubfest</option>
                <option value="Community Outreach">Community Outreach</option>
                <option value="Coordinator Retention">Coordinator Retention</option>
                <option value="Council Operations">Council Operations</option>
                <option value="Culture">Culture</option>
                <option value="Director of Events">Director of Events</option>
                <option value="ECCS Fees">ECCS Fees</option>
                <option value="Elections">Elections</option>
                <option value="Engineering Competition Delegate Funding">Engineering Competition Delegate Funding</option>
                <option value="Engineering Help Centre">Engineering Help Centre</option>
                <option value="ESSCO Membership">ESSCO Membership</option>
                <option value="ESSCO Ontario Engineering Competition">ESSCO Ontario Engineering Competition</option>
                <option value="Executive Operations">Executive Operations</option>
                <option value="Executive Planning Weekend">Executive Planning Weekend</option>
                <option value="Faculty Frenzy">Faculty Frenzy</option>
                <option value="Fireball">Fireball</option>
                <option value="First Year Society">First Year Society</option>
                <option value="Frequency">Frequency</option>
                <option value="Frost Week">Frost Week</option>
                <option value="Fundraising Donations">Fundraising Donations</option>
                <option value="Handbook">Handbook</option>
                <option value="Hatch Student Spaces">Hatch Student Spaces</option>
                <option value="Hatch Student Workshop">Hatch Student Workshop</option>
                <option value="Intramurals">Intramurals</option>
                <option value="IT">IT</option>
                <option value="Jumpsuit Initiative">Jumpsuit Initiative</option>
                <option value="Kennedy (formerly called Iron Ring)">Kennedy (formerly called Iron Ring)</option>
                <option value="Leadership Development Conference">Leadership Development Conference</option>
                <option value="Long Term Investments">Long Term Investments</option>
                <option value="Lounge">Lounge</option>
                <option value="McMaster Engineering Competition">McMaster Engineering Competition</option>
                <option value="Mentorship Program">Mentorship Program</option>
                <option value="MES Branding">MES Branding</option>
                <option value="MES Card Supplies">MES Card Supplies</option>
                <option value="National Engineering Month">National Engineering Month</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Oksoberfest">Oksoberfest</option>
                <option value="Open Conferences & Competitions">Open Conferences & Competitions</option>
                <option value="Operational Contingency">Operational Contingency</option>
                <option value="Operations">Operations</option>
                <option value="Professional Development">Professional Development</option>
                <option value="Semi Annual General Meeting">Semi Annual General Meeting</option>
                <option value="Sports Events">Sports Events</option>
                <option value="Spread the Love Week">Spread the Love Week</option>
                <option value="Student Group Leadership Training">Student Group Leadership Training</option>
                <option value="Student Projects">Student Projects</option>
                <option value="Sustainability">Sustainability</option>
                <option value="Talent Show">Talent Show</option>
                <option value="The Drain">The Drain</option>
                <option value="The Event">The Event</option>
                <option value="Town Halls">Town Halls</option>
                <option value="Trailer">Trailer</option>
                <option value="Trivia Night">Trivia Night</option>
                <option value="Tutoring Program">Tutoring Program</option>
                <option value="Two Way Radio Frequency License">Two Way Radio Frequency License</option>
                <option value="Website / InfraTech">Website / InfraTech</option>
                <option value="Welcome Week">Welcome Week</option>
                <option value="Wellness">Wellness</option>
              </select>
              {errors.budget_line && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.budget_line.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 3: Approval Information */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Approval Information</h2>
            <div className="mb-4">
              <label htmlFor="approved_individual_or_project_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Approved Individual / Project Name
              </label>
              <input
                {...register("approved_individual_or_project_name", { required: "This field is required" })}
                type="text"
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.approved_individual_or_project_name && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.approved_individual_or_project_name.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 4: Team Information */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Team Information</h2>
            <div className="mb-4">
              <label htmlFor="sport_and_team_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sport and Team Name
              </label>
              <select
                {...register("sport_and_team_name", { required: "Sport and Team Name is required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Select Sport and Team Name</option>
                <option value="Badminton - Dinogals">Badminton - Dinogals</option>
                <option value="Badminton - Down Bad-Minton">Badminton - Down Bad-Minton</option>
                <option value="Badminton - Feather Fighters">Badminton - Feather Fighters</option>
                <option value="Basketball - Hungry Marauders">Basketball - Hungry Marauders</option>
                <option value="Basketball - idk?">Basketball - idk?</option>
                <option value="Basketball - Places">Basketball - Places</option>
                <option value="Ice Hockey - Iron Ringers">Ice Hockey - Iron Ringers</option>
                <option value="Ice Hockey - The Steel Beams">Ice Hockey - The Steel Beams</option>
                <option value="Indoor Ultimate Frisbee - Grenglins">Indoor Ultimate Frisbee - Grenglins</option>
                <option value="Indoor Ultimate Frisbee - KerrrrrFrisbee">Indoor Ultimate Frisbee - KerrrrrFrisbee</option>
              </select>
              {errors.sport_and_team_name && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.sport_and_team_name.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 5: Reimbursement Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Reimbursement Details</h2>
            <div className="mb-4">
              <label htmlFor="reimbursment_or_payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reimbursement or Payment?
              </label>
              <select
                {...register("preferred_reimbursement_method", { required: "Selection Required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              >
                <option value="">Select Option</option>
                <option value="Reimbursement">Reimbursement</option>
                <option value="Payment">Payment</option>
              </select>
              {errors.reimbursment_or_payment && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.reimbursment_or_payment.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 6: Payment Details */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Payment Details</h2>
            <div className="mb-4">
              <label htmlFor="amount_requested_cad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Please enter the amount requested in CAD.
              </label>
              <input
                {...register("amount_requested_cad", { required: "Amount is required" })}
                type="text"
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.amount_requested_cad && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.amount_requested_cad.message}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="payment_timeframe" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Timeframe Date
              </label>
              <input
                type="date"
                {...register("payment_timeframe", { required: "Date is required" })}
                className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
              />
              {errors.payment_timeframe && (
                <p className="text-red-500 text-sm dark:text-red-400">{errors.payment_timeframe.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReimbursementForm;
