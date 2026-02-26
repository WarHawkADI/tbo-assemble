"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  amount: number;
  currency?: string;
  description?: string;
}

export function PaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  currency = "INR",
  description = "Event Booking Payment"
}: PaymentModalProps) {
  const [step, setStep] = useState<"details" | "processing" | "success" | "failed">("details");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("Demo User");
  const [processingMessage, setProcessingMessage] = useState("");

  useEffect(() => {
    if (step === "processing") {
      const messages = [
        "Connecting to payment gateway...",
        "Validating card details...",
        "Processing transaction...",
        "Verifying with bank...",
        "Finalizing payment...",
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < messages.length) {
          setProcessingMessage(messages[i]);
          i++;
        } else {
          clearInterval(interval);
          // Simulate success (occasionally fail for realism)
          const success = Math.random() > 0.1; // 90% success rate
          if (success) {
            setStep("success");
            const txnId = `TXN${Date.now().toString(36).toUpperCase()}`;
            setTimeout(() => onSuccess(txnId), 1500);
          } else {
            setStep("failed");
          }
        }
      }, 600);
      return () => clearInterval(interval);
    }
  }, [step, onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
              title="Close payment modal"
              aria-label="Close payment modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Secure Payment</h2>
                <p className="text-sm text-white/80">Demo Mode - No real charges</p>
              </div>
            </div>
            {/* Amount */}
            <div className="mt-4 text-center">
              <p className="text-white/70 text-sm">{description}</p>
              <p className="text-3xl font-bold mt-1">
                {currency === "INR" ? "₹" : "$"}{amount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "details" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Demo Notice */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>This is a demo. No real payment will be processed.</span>
                </div>

                {/* Card Number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Card Number</label>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="font-mono"
                  />
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Expiry</label>
                    <Input
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">CVV</label>
                    <Input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="123"
                      maxLength={3}
                      type="password"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Cardholder Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name on card"
                  />
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Lock className="h-4 w-4" />
                  Pay {currency === "INR" ? "₹" : "$"}{amount.toLocaleString("en-IN")}
                </Button>

                {/* Security Notice */}
                <p className="text-center text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-1">
                  <Lock className="h-3 w-3" />
                  Secured by 256-bit SSL encryption
                </p>
              </form>
            )}

            {step === "processing" && (
              <div className="py-12 text-center">
                <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-zinc-400 animate-pulse">
                  {processingMessage}
                </p>
              </div>
            )}

            {step === "success" && (
              <div className="py-8 text-center">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  Your booking has been confirmed.
                </p>
                <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
                  Continue
                </Button>
              </div>
            )}

            {step === "failed" && (
              <div className="py-8 text-center">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
                  Payment Failed
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                  There was an issue with your card. Please try again.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button onClick={() => setStep("details")}>Try Again</Button>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Card logos */}
          {step === "details" && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-700 flex items-center justify-center gap-4">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Accepted Cards</span>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-bold text-sm">VISA</span>
                <span className="font-bold text-sm">MC</span>
                <span className="font-bold text-sm">AMEX</span>
                <span className="font-bold text-sm">RuPay</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
