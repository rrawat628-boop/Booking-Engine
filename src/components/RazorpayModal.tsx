import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Smartphone, X, Shield, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure: (error: string) => void;
  amount: number;
  currency: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
}

export default function RazorpayModal({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  amount,
  currency = 'INR',
  guestEmail,
  guestPhone,
  roomName
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'upi' | 'net'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCounter, setQrCounter] = useState(120); // 2 min timeout
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'upi' && qrCounter > 0) {
      timer = setTimeout(() => setQrCounter(qrCounter - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [activeTab, qrCounter]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    setExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const executePayment = (status: 'success' | 'failed') => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    setTimeout(() => {
      setIsProcessing(false);
      if (status === 'success') {
        setPaymentStatus('success');
        const payId = `pay_rzp_${Math.random().toString(36).substring(2, 11)}`;
        const ordId = `order_rzp_${Math.random().toString(36).substring(2, 11)}`;
        setTimeout(() => {
          onSuccess(payId, ordId);
        }, 1200);
      } else {
        setPaymentStatus('failed');
        setTimeout(() => {
          onFailure('Payment was declined by the bank/user simulator.');
          setPaymentStatus('idle');
        }, 1500);
      }
    }, 1800);
  };

  const formatQrTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans animate-fade-in" id="rzp_overlay">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col md:flex-row h-full md:h-auto max-h-[90vh]">
        
        {/* Left Panel: Merchant Header & Info */}
        <div className="bg-slate-900 text-white p-6 md:w-5/12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-emerald-600 p-1.5 rounded-md text-xs font-bold tracking-wider">Holiday Rentals</span>
              <span className="text-sm font-semibold tracking-wide text-slate-300">SECURE PAY</span>
            </div>
            
            <p className="text-xs text-slate-400 mb-1">Holiday Rentals Booking</p>
            <h3 className="text-base font-bold text-slate-100 line-clamp-2 mb-4">{roomName}</h3>
            
            <div className="border-t border-slate-800 pt-4 mt-2">
              <p className="text-xs text-slate-400">Total Amount</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-blue-400">₹{amount.toFixed(2)}</span>
                <span className="text-xs text-slate-400">{currency}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:block border-t border-slate-800 pt-4 mt-6">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Razorpay Trusted Merchant</span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1">PCI-DSS Compliant 256-Bit SSL Secured Transaction</p>
          </div>
        </div>

        {/* Right Panel: Interactive payment form */}
        <div className="p-6 md:w-7/12 flex flex-col justify-between bg-slate-50 overflow-y-auto">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <img src="https://razorpay.com/favicon.png" className="w-5 h-5 object-contain" alt="Razorpay Logo" />
              <span className="font-bold text-sm text-slate-800">Razorpay Checkout</span>
            </div>
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded-full transition-colors duration-150"
              id="rzp_close_btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center" id="rzp_processing">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h4 className="font-semibold text-slate-800">Processing Secure Payment...</h4>
              <p className="text-xs text-slate-500 mt-1">Please do not refresh the page or click back.</p>
              <p className="text-[10px] text-slate-400 mt-4">Contacting Razorpay Secure Gateways...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center" id="rzp_success">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-emerald-700 text-lg">Payment Successful!</h4>
              <p className="text-xs text-slate-500 mt-1">Mock order authorized & verified.</p>
              <p className="text-xs font-mono text-slate-400 mt-3">Auth ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="flex flex-col items-center justify-center py-12 text-center" id="rzp_failed">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-rose-700 text-lg">Payment Declined</h4>
              <p className="text-xs text-slate-500 mt-1">Your payment simulator declined this checkout.</p>
              <button 
                onClick={() => setPaymentStatus('idle')}
                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {paymentStatus === 'idle' && (
            <>
              {/* Payment Mode Selector Tabs */}
              <div className="flex gap-1 border-b border-slate-200 my-4" id="rzp_modes">
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium border-b-2 transition-all ${
                    activeTab === 'card' 
                      ? 'border-blue-600 text-blue-600 bg-white shadow-xs' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="rzp_tab_card"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setActiveTab('upi')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium border-b-2 transition-all ${
                    activeTab === 'upi' 
                      ? 'border-blue-600 text-blue-600 bg-white shadow-xs' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="rzp_tab_upi"
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  onClick={() => setActiveTab('net')}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium border-b-2 transition-all ${
                    activeTab === 'net' 
                      ? 'border-blue-600 text-blue-600 bg-white shadow-xs' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  id="rzp_tab_net"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 py-2">
                {activeTab === 'card' && (
                  <div className="space-y-3" id="rzp_form_card">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        id="rzp_card_num"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center"
                          id="rzp_card_expiry"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          onChange={handleCvvChange}
                          className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono"
                          id="rzp_card_cvv"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase font-sans text-xs tracking-wider"
                        id="rzp_card_name"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'upi' && (
                  <div className="space-y-4 flex flex-col items-center py-2" id="rzp_form_upi">
                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xs flex flex-col items-center">
                      {/* Interactive live QR code simulation */}
                      <div className="w-36 h-36 bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 relative group">
                        <div className="absolute inset-2 bg-[radial-gradient(#1e293b_35%,transparent_40%)] bg-[size:10px_10px] opacity-70"></div>
                        <div className="absolute w-6 h-6 border-2 border-slate-900 top-2 left-2 border-r-0 border-b-0"></div>
                        <div className="absolute w-6 h-6 border-2 border-slate-900 top-2 right-2 border-l-0 border-b-0"></div>
                        <div className="absolute w-6 h-6 border-2 border-slate-900 bottom-2 left-2 border-r-0 border-t-0"></div>
                        <div className="absolute w-6 h-6 border-2 border-slate-900 bottom-2 right-2 border-l-0 border-t-0"></div>
                        <span className="bg-slate-900 text-white p-1 rounded-sm text-[8px] font-bold z-10 uppercase tracking-widest shadow-md">SCAN UPI</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2">Scan with GPay, PhonePe, or BHIM</p>
                      <span className="text-[11px] text-blue-600 font-semibold mt-1">Expiry: {formatQrTime(qrCounter)}</span>
                    </div>

                    <div className="w-full border-t border-slate-200 pt-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="yourname@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-md py-2 pl-3 pr-20 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                          id="rzp_upi_id"
                        />
                        <button 
                          onClick={() => executePayment('success')}
                          disabled={!upiId.includes('@')}
                          className="absolute right-1 top-1 bg-blue-600 text-white rounded-md px-3 py-1 text-xs font-semibold hover:bg-blue-700 disabled:opacity-40"
                        >
                          Verify & Pay
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'net' && (
                  <div className="space-y-3" id="rzp_form_net">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Popular Bank</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank'].map(bank => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`border rounded-lg py-2.5 px-3 text-xs font-semibold text-left transition ${
                            selectedBank === bank 
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs' 
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Secure checkout trigger controls */}
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => executePayment('success')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 font-bold text-sm tracking-wide transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                    id="rzp_pay_success_btn"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize Pay (Simulate Success)</span>
                  </button>
                  <button
                    onClick={() => executePayment('failed')}
                    className="bg-rose-50 border border-rose-300 hover:bg-rose-100 text-rose-600 rounded-lg py-2.5 px-3 font-semibold text-xs transition"
                    id="rzp_pay_fail_btn"
                    title="Simulate Bank/Gateway Failure"
                  >
                    Fail Pay
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 py-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Razorpay API is active in Sandbox. All accounts are simulation only.</span>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
