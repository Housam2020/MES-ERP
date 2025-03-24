"use client";
import React from "react";
import { useFormContext } from "./ReimbursementFormContext";

const PaymentDetailsSection = () => {
  const {
    methods: { register, formState: { errors } }
  } = useFormContext();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Payment Details</h2>

      {/* Reimbursement or Payment */}
      <div className="mb-4">
        <label htmlFor="reimbursement_or_payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reimbursement or Payment?
        </label>
        <select
          {...register("reimbursement_or_payment", { required: "Selection Required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="">Select Option</option>
          <option value="Reimbursement">Reimbursement</option>
          <option value="Payment">Payment</option>
        </select>
        {errors.reimbursement_or_payment && (
          <p className="text-red-500 text-sm dark:text-red-400">{errors.reimbursement_or_payment.message}</p>
        )}
      </div>

      {/* Currency Type */}
      <div className="mb-4">
        <label
          htmlFor="currency_type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Select the currency type
        </label>
        <select
          {...register("currency_type", { required: "Currency type is required" })}
          defaultValue="CAD"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="CAD">CAD</option>
          <option value="USD">USD</option>
        </select>
        {errors.currency_type && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.currency_type.message}
          </p>
        )}
      </div>

      {/* Amount Requested */}
      <div className="mb-4">
        <label
          htmlFor="amount_requested_cad"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Please enter the amount requested in the currency you chose
        </label>
        <input
          {...register("amount_requested_cad", { required: "Amount is required" })}
          type="text"
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.amount_requested_cad && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.amount_requested_cad.message}
          </p>
        )}
      </div>

      {/* Payment Timeframe */}
      <div className="mb-4">
        <label
          htmlFor="payment_timeframe"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Payment Timeframe Date
        </label>
        <input
          type="date"
          {...register("payment_timeframe", { required: "Date is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        />
        {errors.payment_timeframe && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.payment_timeframe.message}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="mb-4">
        <label
          htmlFor="preferred_payment_form"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Preferred Payment Method
        </label>
        <select
          {...register("preferred_payment_form", { required: "Payment method is required" })}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
        >
          <option value="">Select Payment Method</option>
          <option value="E-Transfer">E-Transfer</option>
          <option value="Direct Deposit">Direct Deposit</option>
          <option value="Cheque">Cheque</option>
        </select>
        {errors.preferred_payment_form && (
          <p className="text-red-500 text-sm dark:text-red-400">
            {errors.preferred_payment_form.message}
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="mb-4">
        <label
          htmlFor="additional_payment_info"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Additional Payment Information (optional)
        </label>
        <textarea
          {...register("additional_payment_info")}
          className="mt-1 p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
          rows="4"
        ></textarea>
      </div>
    </div>
  );
};

export default PaymentDetailsSection;
