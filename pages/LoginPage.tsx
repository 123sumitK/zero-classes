
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login, register, loginWithPhone, sendOtp, verifyOtp, isLoading } = useStore();
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone'>('password');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (type: 'email' | 'phone') => {
    const target = type === 'email' ? email : phone;
    if(!target) return setError(`Enter ${type} first`);
    
    try {
        await sendOtp(target, type);
        setOtpSent(true);
        setError('');
        alert(`OTP sent to ${target}. (If Phone: CHECK BACKEND TERMINAL)`);
    } catch(e) { setError('Failed to send OTP'); }
  };

  const handleVerify = async (type: 'email' | 'phone') => {
    const target = type === 'email' ? email : phone;
    const isValid = await verifyOtp(target, otp);
    if (isValid) {
        setVerified(true);
        setOtpSent(false);
        if (view === 'login' && type === 'phone') {
            await loginWithPhone(phone);
        }
    } else {
        setError('Invalid OTP');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
        if (view === 'login') {
            if (loginMethod === 'password') await login(email, password);
        } else {
            if (!verified) return setError('Please verify Phone OTP first');
            await register(name, email, phone, password, role);
        }
    } catch (err: any) {
        setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">Zero Classes</h1>
        
        <div className="flex mb-6 border-b">
             <button className={`flex-1 pb-2 ${view==='login'?'border-b-2 border-indigo-600 text-indigo-600':''}`} onClick={()=>setView('login')}>Login</button>
             <button className={`flex-1 pb-2 ${view==='signup'?'border-b-2 border-indigo-600 text-indigo-600':''}`} onClick={()=>setView('signup')}>Sign Up</button>
        </div>

        {view === 'login' && (
            <div className="flex gap-2 mb-4">
                <Button size="sm" variant={loginMethod==='password'?'primary':'outline'} onClick={()=>setLoginMethod('password')}>Password</Button>
                <Button size="sm" variant={loginMethod==='phone'?'primary':'outline'} onClick={()=>setLoginMethod('phone')}>Phone OTP</Button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
                <>
                   <Input label="Name" value={name} onChange={e=>setName(e.target.value)} required />
                   <div className="flex gap-2">
                       <Input label="Phone (+91..)" value={phone} onChange={e=>setPhone(e.target.value)} disabled={verified} required />
                       {!verified && (
                           <Button type="button" className="mt-6" onClick={()=>otpSent ? handleVerify('phone') : handleSendOtp('phone')}>
                               {otpSent ? 'Verify' : 'Send OTP'}
                           </Button>
                       )}
                   </div>
                   {otpSent && !verified && <Input placeholder="Enter OTP" value={otp} onChange={e=>setOtp(e.target.value)} />}
                   {verified && <p className="text-green-600 text-sm">Phone Verified ✅</p>}
                </>
            )}

            {loginMethod === 'password' || view === 'signup' ? (
                <>
                   <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
                   <Input label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </>
            ) : (
                // Login via Phone OTP
                <>
                   <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)} required />
                   {otpSent ? (
                       <div className="flex gap-2">
                           <Input placeholder="OTP" value={otp} onChange={e=>setOtp(e.target.value)} />
                           <Button type="button" className="mt-6" onClick={()=>handleVerify('phone')}>Verify</Button>
                       </div>
                   ) : (
                       <Button type="button" onClick={()=>handleSendOtp('phone')} className="w-full">Send Login OTP</Button>
                   )}
                </>
            )}

            {view === 'signup' && (
                 <div className="flex gap-2">
                    <Button type="button" variant={role==='STUDENT'?'primary':'outline'} onClick={()=>setRole(UserRole.STUDENT)} className="flex-1">Student</Button>
                    <Button type="button" variant={role==='INSTRUCTOR'?'primary':'outline'} onClick={()=>setRole(UserRole.INSTRUCTOR)} className="flex-1">Instructor</Button>
                 </div>
            )}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {(view === 'signup' || loginMethod === 'password') && (
                <Button type="submit" isLoading={isLoading} className="w-full mt-4">
                    {view === 'login' ? 'Login' : 'Register'}
                </Button>
            )}
        </form>
      </div>
    </div>
  );
};
