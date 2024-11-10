"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from 'uuid';

type FormData = {
  email_address: string;
  full_name: string;
  contact_phone_number: string;
  role: string;
  budget_line: string;
  group_or_team_name: string;
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
};

const ReimbursementForm: React.FC = () => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>();
  const [formStep, setFormStep] = useState(0);

  const onSubmit = async (data: FormData) => {
    const supabase = await createClient();
    try {
      // Get the logged-in user's ID
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError || !user) {
        alert('Failed to get the logged-in user.');
        throw userError;
      }
      // Generate a unique UUID for the new record
      const request_id = uuidv4();
      const user_id = user.id;
      const newData = { request_id:  request_id, user_id: user_id, ...data };
  
      // Insert the payment request
      const { error } = await supabase
        .from('payment_requests')
        .insert([newData]);
  
      if (error) {
        if (error.code === '23505') { // Unique violation error code for PostgreSQL
          alert('A record with this information already exists.');
        } else {
          alert(`Failed to submit the form: ${error.message}`);
        }
        throw error;
      }
      alert('Form submitted successfully');
  
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto bg-white p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">MES Payment and Reimbursement Form</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          {formStep === 0 && (
            <>
              <div className="mb-4">
                <label htmlFor="email_address" className="block text-sm font-medium">Email Address</label>
                <input
                  {...register('email_address', { required: 'Email is required' })}
                  type="email"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.email_address && <p className="text-red-500 text-sm">{errors.email_address.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
                <input
                  {...register('full_name', { required: 'Full name is required' })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="contact_phone_number" className="block text-sm font-medium">Contact Phone Number</label>
                <input
                  {...register('contact_phone_number', { required: 'Phone number is required' })}
                  type="tel"
                  className="mt-1 p-2 border rounded w-full"
                />
                {errors.contact_phone_number && <p className="text-red-500 text-sm">{errors.contact_phone_number.message}</p>}
              </div>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(1)}
              >
                Next
              </button>
            </>
          )}

          {formStep === 1 && (
            <>
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium">Role</label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select role</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Chief Returning Officer">Chief Returning Officer</option>
                  {/* Add all roles here */}
                </select>
                {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
              </div>
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(0)}
              >
                Previous
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white py-2 px-4 rounded mt-4"
                onClick={() => setFormStep(2)}
              >
                Next
              </button>
            </>
          )}

          {formStep === 2 && (
            <>
              <div className="mb-4">
                <label htmlFor="budget_line" className="block text-sm font-medium">Relevant Budget Line</label>
                <select
                  {...register('budget_line', { required: 'Budget line is required' })}
                  className="mt-1 p-2 border rounded w-full"
                >
                  <option value="">Select budget line</option>
                  <option value="Academic Events & Info Sessions">Academic Events & Info Sessions</option>
                  {/* Add all budget lines here */}
                </select>
                {errors.budget_line && <p className="text-red-500 text-sm">{errors.budget_line.message}</p>}
              </div>
              {/* Additional sections... */}
              <button
                type="button"
                className="bg-gray-400 text-white py-2 px-4 rounded mt-4 mr-2"
                onClick={() => setFormStep(1)}
              >
                Previous
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-4 rounded mt-4"
              >
                Submit
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReimbursementForm;