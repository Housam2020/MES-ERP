"use client";
import React, { createContext, useContext, useState } from "react";
import { useForm, FormProvider as RHFFormProvider } from "react-hook-form";

// Create context
const FormContext = createContext();

// Custom hook to use the form context
export const useFormContext = () => useContext(FormContext);

// Provider component - renamed to ReimbursementFormProvider to avoid collision
export const ReimbursementFormProvider = ({ children }) => {
  const methods = useForm();
  const [receiptFile, setReceiptFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");

  const value = {
    methods,
    receiptFile,
    setReceiptFile,
    extractedText,
    setExtractedText,
    isProcessing,
    setIsProcessing,
    userGroups,
    setUserGroups,
    selectedGroup,
    setSelectedGroup
  };

  return (
    <FormContext.Provider value={value}>
      <RHFFormProvider {...methods}>
        {children}
      </RHFFormProvider>
    </FormContext.Provider>
  );
};

export default FormContext;
