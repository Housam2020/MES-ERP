"use client";
import React from "react";
import { useFormContext } from "./ReimbursementFormContext";

// Approval Information Section
export const ApprovalInfoSection = () => {
  const {
    methods: { register, formState: { errors } }
  } = useFormContext();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Approval Information</h2>
      <div className="mb-4">
        <label 
          htmlFor="approved_individual_or_project_name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Approved Individual / Project Name
        </label>
        <input
          {...register("approved_individual_or_project_name", { required: "This field is required" })}
          type="text"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.approved_individual_or_project_name && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.approved_individual_or_project_name.message}
          </p>
        )}
      </div>
    </div>
  );
};

// Team Information Section
export const TeamInfoSection = () => {
  const {
    methods: { register, formState: { errors } }
  } = useFormContext();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Team Information</h2>
      <div className="mb-4">
        <label 
          htmlFor="sport_and_team_name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Sport and Team Name
        </label>
        <select
          {...register("sport_and_team_name")}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="">Select Sport and Team Name</option>
          <option value="Badminton - Dinogals">Badminton - Dinogals</option>
          <option value="Badminton - Down Bad-Minton">Badminton - Down Bad-Minton</option>
          <option value="Badminton - Feather Fighters">Badminton - Feather Fighters</option>
          <option value="Basketball - Hungry Marauders">Basketball - Hungry Marauders</option>
          <option value="Basketball - Other">Basketball - Other</option>
          <option value="Basketball - Places">Basketball - Places</option>
          <option value="Ice Hockey - Iron Ringers">Ice Hockey - Iron Ringers</option>
          <option value="Ice Hockey - The Steel Beams">Ice Hockey - The Steel Beams</option>
          <option value="Indoor Ultimate Frisbee - Grenglins">Indoor Ultimate Frisbee - Grenglins</option>
          <option value="Indoor Ultimate Frisbee - KerrrrrFrisbee">Indoor Ultimate Frisbee - KerrrrrFrisbee</option>
        </select>
        {errors.sport_and_team_name && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.sport_and_team_name.message}
          </p>
        )}
      </div>
      
      {/* Conference Information */}
      <div className="mb-4">
        <label 
          htmlFor="conference_or_competition_name" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Conference/Competition Name (if applicable)
        </label>
        <input
          {...register("conference_or_competition_name")}
          type="text"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
      </div>
      
      <div className="mb-4">
        <label 
          htmlFor="conference_competition_type" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Conference/Competition Type (if applicable)
        </label>
        <select
          {...register("conference_competition_type")}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="">Select Type</option>
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
          <option value="Affiliate">Affiliate</option>
        </select>
      </div>
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="head_delegate"
          {...register("head_delegate")}
          className="mr-2"
        />
        <label 
          htmlFor="head_delegate" 
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          I am the head delegate
        </label>
      </div>
    </div>
  );
};

// Payment Method Details Section (based on selected payment method)
export const PaymentMethodDetailsSection = () => {
  const {
    methods: { register, watch, formState: { errors } }
  } = useFormContext();

  const preferredPaymentForm = watch("preferred_payment_form");

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Payment Method Details</h2>
      
      {preferredPaymentForm === "E-Transfer" && (
        <div className="space-y-4">
          <div>
            <label 
              htmlFor="reimbursement_payable_to" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Payable To
            </label>
            <input
              {...register("reimbursement_payable_to", { required: "Payee name is required" })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.reimbursement_payable_to && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.reimbursement_payable_to.message}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="interac_phone_or_email" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Interac E-Transfer Email or Phone Number
            </label>
            <input
              {...register("interac_phone_or_email", { required: "E-transfer contact is required" })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.interac_phone_or_email && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.interac_phone_or_email.message}
              </p>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirmation_email_phone_correct"
              {...register("confirmation_email_phone_correct", { required: "You must confirm this is correct" })}
              className="mr-2"
            />
            <label 
              htmlFor="confirmation_email_phone_correct" 
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              I confirm this email/phone is correct for e-transfer
            </label>
          </div>
          {errors.confirmation_email_phone_correct && (
            <p className="text-red-500 text-sm dark:text-red-400">
              {errors.confirmation_email_phone_correct.message}
            </p>
          )}
        </div>
      )}
      
      {preferredPaymentForm === "Direct Deposit" && (
        <div className="space-y-4">
          <div>
            <label 
              htmlFor="reimbursement_payable_to" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account Holder Name
            </label>
            <input
              {...register("reimbursement_payable_to", { required: "Account holder name is required" })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.reimbursement_payable_to && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.reimbursement_payable_to.message}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="institution_no" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Institution Number (3 digits)
            </label>
            <input
              {...register("institution_no", { 
                required: "Institution number is required",
                pattern: {
                  value: /^\d{3}$/,
                  message: "Must be 3 digits"
                }
              })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.institution_no && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.institution_no.message}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="transit_no" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Transit Number (5 digits)
            </label>
            <input
              {...register("transit_no", { 
                required: "Transit number is required",
                pattern: {
                  value: /^\d{5}$/,
                  message: "Must be 5 digits"
                }
              })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.transit_no && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.transit_no.message}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="account_no" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account Number
            </label>
            <input
              {...register("account_no", { required: "Account number is required" })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.account_no && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.account_no.message}
              </p>
            )}
          </div>
        </div>
      )}
      
      {preferredPaymentForm === "Cheque" && (
        <div className="space-y-4">
          <div>
            <label 
              htmlFor="reimbursement_payable_to" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Payable To
            </label>
            <input
              {...register("reimbursement_payable_to", { required: "Payee name is required" })}
              type="text"
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            />
            {errors.reimbursement_payable_to && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.reimbursement_payable_to.message}
              </p>
            )}
          </div>
          
          <div>
            <label 
              htmlFor="cheque_delivery_method" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cheque Delivery Method
            </label>
            <select
              {...register("cheque_delivery_method", { required: "Delivery method is required" })}
              className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
            >
              <option value="">Select Delivery Method</option>
              <option value="Pickup">Pickup from MES Office</option>
              <option value="Mail">Mail to Address</option>
            </select>
            {errors.cheque_delivery_method && (
              <p className="text-red-500 text-sm dark:text-red-400">
                {errors.cheque_delivery_method.message}
              </p>
            )}
          </div>
          
          {watch("cheque_delivery_method") === "Mail" && (
            <div className="space-y-4 border p-4 rounded">
              <h3 className="font-medium">Mailing Address</h3>
              
              <div>
                <label 
                  htmlFor="street_number_and_name" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Street Address
                </label>
                <input
                  {...register("street_number_and_name", { required: "Street address is required" })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                {errors.street_number_and_name && (
                  <p className="text-red-500 text-sm dark:text-red-400">
                    {errors.street_number_and_name.message}
                  </p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="city" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City
                </label>
                <input
                  {...register("city", { required: "City is required" })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm dark:text-red-400">
                    {errors.city.message}
                  </p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="province_state" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Province/State
                </label>
                <input
                  {...register("province_state", { required: "Province/State is required" })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                {errors.province_state && (
                  <p className="text-red-500 text-sm dark:text-red-400">
                    {errors.province_state.message}
                  </p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="country" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Country
                </label>
                <input
                  {...register("country", { required: "Country is required" })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                {errors.country && (
                  <p className="text-red-500 text-sm dark:text-red-400">
                    {errors.country.message}
                  </p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="postal_code" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Postal/ZIP Code
                </label>
                <input
                  {...register("postal_code", { required: "Postal code is required" })}
                  type="text"
                  className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                {errors.postal_code && (
                  <p className="text-red-500 text-sm dark:text-red-400">
                    {errors.postal_code.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
