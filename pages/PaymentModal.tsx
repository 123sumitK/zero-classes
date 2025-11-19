
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useStore } from '../context/StoreContext';
import { Input } from '../components/ui/Input';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  price: number;
  courseTitle: string;
  courseId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, price, courseTitle, courseId }) => {
  const { processPayment } = useStore();
  const [method, setMethod] = useState<'CARD' | 'UPI'>('CARD');
  const [upiId, setUpiId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerifyUpi = () => {
    if (!upiId.includes('@')) {
        setError('Invalid UPI ID format');
        return;
    }
    setIsVerifying(true);
    setError('');
    
    // Simulate verification
    setTimeout(() => {
        setIsVerifying(false);
        if (upiId === '9661778393@ikwik') {
            // Owner account
            setIsVerified(true);
            setBeneficiaryName('Zero Classes Owner');
        } else {
            // Allow any valid looking UPI for testing
            setIsVerified(true);
            setBeneficiaryName('Test User');
        }
    }, 1500);
  };

  const handlePay = async () => {
    if (method === 'UPI' && !isVerified) {
        setError('Please verify UPI ID first');
        return;
    }

    setIsLoading(true);
    setError('');
    // 1 USD = 84 INR approx.
    const amountINR = Math.round(price * 84);
    
    const success = await processPayment({
        courseId: courseId || '',
        amount: amountINR,
        currency: 'INR',
        paymentMethod: method,
        upiId: method === 'UPI' ? upiId : undefined
    });

    setIsLoading(false);

    if (success) {
        await onSuccess();
        onClose();
    } else {
        setError('Payment failed. Please try again.');
    }
  };

  const amountINR = Math.round(price * 84);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enroll in Course</h2>
        <p className="text-gray-600 mb-6">{courseTitle}</p>

        <div className="bg-indigo-50 p-4 rounded-lg mb-6 text-center">
            <p className="text-sm text-gray-500 uppercase">Total Amount</p>
            <p className="text-3xl font-bold text-indigo-700">₹{amountINR}</p>
            <div className="flex justify-center items-center gap-1 text-xs text-gray-400 mt-1">
                <span>Sending to:</span>
                <span className="font-mono bg-gray-200 text-gray-600 px-1 rounded">9661778393@ikwik</span>
            </div>
        </div>
        
        <div className="flex mb-6 border-b">
             <button className={`flex-1 pb-2 font-medium ${method==='CARD'?'border-b-2 border-indigo-600 text-indigo-600 text-indigo-600':'text-gray-500'}`} onClick={()=>setMethod('CARD')}>Card</button>
             <button className={`flex-1 pb-2 font-medium ${method==='UPI'?'border-b-2 border-indigo-600 text-indigo-600 text-indigo-600':'text-gray-500'}`} onClick={()=>setMethod('UPI')}>UPI</button>
        </div>

        {method === 'CARD' && (
            <div className="space-y-4 mb-6">
                <Input placeholder="Card Number" />
                <div className="flex gap-4">
                    <Input placeholder="MM/YY" />
                    <Input placeholder="CVC" />
                </div>
            </div>
        )}

        {method === 'UPI' && (
            <div className="mb-6 space-y-2">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Enter UPI ID (e.g. user@bank)" 
                        value={upiId} 
                        onChange={e => { setUpiId(e.target.value); setIsVerified(false); setError(''); }}
                    />
                    <Button variant="secondary" onClick={handleVerifyUpi} disabled={isVerifying || isVerified} className="whitespace-nowrap">
                        {isVerifying ? 'Checking...' : isVerified ? 'Verified' : 'Verify'}
                    </Button>
                </div>
                {isVerified && <p className="text-green-600 text-sm">✅ Verified Name: {beneficiaryName}</p>}
            </div>
        )}

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <Button onClick={handlePay} isLoading={isLoading} disabled={method === 'UPI' && !isVerified} className="w-full py-3 text-lg">
            Pay ₹{amountINR}
        </Button>

        <Button variant="secondary" onClick={onClose} className="w-full mt-3">
            Cancel
        </Button>
      </div>
    </div>
  );
};
