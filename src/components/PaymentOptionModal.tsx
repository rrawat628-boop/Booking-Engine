import React, { useState } from 'react';
import { X, CreditCard, Landmark, Percent, ShieldCheck, Check, Info } from 'lucide-react';

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'full' | 'partial', amountToPayNow: number, remainingAmount: number, percentage: number) => void;
  totalAmount: number;
  currency?: string;
  roomName: string;
  defaultPercentage?: number;
}

export default function PaymentOptionModal({
  isOpen,
  onClose,
  onSelect,
  totalAmount,
  currency = 'INR',
  roomName,
  defaultPercentage = 30
}: PaymentOptionModalProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');

  if (!isOpen) return null;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const payNowAmount = paymentType === 'full' 
    ? totalAmount 
    : (totalAmount * defaultPercentage) / 100;

  const remainingAmount = totalAmount - payNowAmount;

  const handleProceed = () => {
    onSelect(
      paymentType,
      payNowAmount,
      remainingAmount,
      paymentType === 'full' ? 100 : defaultPercentage
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans animate-fade-in" id="payment_option_overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative">
          <div>
            <span className="bg-blue-600 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 inline-block">
              Secure Checkout Scheme
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">Select Payment Term</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium line-clamp-1">
              Flexible options for booking <span className="text-blue-400 font-semibold">{roomName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1">
          
          {/* Summary Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Booking Cost</span>
              <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                {formatPrice(totalAmount)}
              </div>
            </div>
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
              100% Secure Gateway
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose payment option</h4>

            {/* Option 1: Full Payment */}
            <div 
              onClick={() => setPaymentType('full')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-4 ${
                paymentType === 'full' 
                  ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-500' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentType === 'full' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentType === 'full' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-800">Full Payment (100%)</span>
                  <span className="font-extrabold text-sm text-slate-900">{formatPrice(totalAmount)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pay the total amount now. Quick self check-in and absolute peace of mind during your stay.
                </p>
                {paymentType === 'full' && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>No outstanding balances at property check-in</span>
                  </div>
                )}
              </div>
            </div>

            {/* Option 2: Partial / Deposit Payment */}
            <div 
              onClick={() => setPaymentType('partial')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-start gap-4 ${
                paymentType === 'partial' 
                  ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-500' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                paymentType === 'partial' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {paymentType === 'partial' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-slate-800">Partial Payment (Deposit)</span>
                  <span className="font-extrabold text-sm text-blue-700">{defaultPercentage}% Deposit</span>
                </div>
                <p className="text-xs text-slate-500">
                  Pay a small deposit today to confirm your booking instantly. Settle the balance directly during check-in.
                </p>

                {/* Sub-selectors for deposit percentage replaced by static admin config */}
                {paymentType === 'partial' && (
                  <div className="pt-2 border-t border-slate-200" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-[11px] font-bold text-blue-800">
                        Admin Configured Deposit: <span className="font-extrabold text-blue-700">{defaultPercentage}%</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown / Summary details */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h5 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-1.5">Payment Terms Breakdown</h5>
            <div className="flex justify-between text-slate-600">
              <span>Amount to Pay Now ({paymentType === 'full' ? '100' : defaultPercentage}%):</span>
              <span className="font-bold text-slate-800">{formatPrice(payNowAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 border-b border-slate-200/60 pb-2">
              <span>Outstanding Balance to Pay on Arrival:</span>
              <span className="font-bold font-mono">{formatPrice(remainingAmount)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 font-bold text-slate-800">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Today's Total Due:</span>
              </span>
              <span className="text-sm font-black text-blue-700">{formatPrice(payNowAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-100/50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-1/3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl py-2.5 text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="w-full sm:w-2/3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5"
            id="payment_option_proceed_btn"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Proceed to Razorpay</span>
          </button>
        </div>

      </div>
    </div>
  );
}
