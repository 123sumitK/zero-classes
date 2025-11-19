
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ClassSession, CourseMaterial } from '../types';
import { auth } from '../firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Define global types
declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

interface StoreContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role: UserRole) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  
  // OTP Functions
  setupRecaptcha: (containerId: string) => void;
  sendOtp: (identifier: string, type: 'email' | 'phone') => Promise<void>;
  verifyOtp: (identifier: string, otp: string) => Promise<boolean>;
  
  // Data
  classes: ClassSession[];
  addClass: (session: ClassSession) => void;
  updateClass: (session: ClassSession) => void;
  
  materials: CourseMaterial[];
  addMaterial: (material: CourseMaterial) => void;
  
  enroll: (courseId: string) => Promise<boolean>;
  
  processPayment: (details: { courseId: string, amount: number, currency: string, paymentMethod: 'CARD' | 'UPI', upiId?: string }) => Promise<boolean>;
  sendNotification: (subject: string, message: string) => Promise<void>;
  
  allUsers: User[];
  deleteUser: (id: string) => void;
  isLoading: boolean;
  isOfflineMode: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const API_URL = 'http://localhost:5001/api';

// Helper to format phone number to E.164 (assumes India +91 if missing)
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  // Remove spaces, dashes, parens
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('91') && clean.length === 12) return `+${clean}`;
  return `+91${clean}`;
};

const MOCK_CLASSES: ClassSession[] = [
  { id: '1', title: 'Introduction to React', description: 'Learn basics.', date: new Date(Date.now() + 86400000).toISOString(), meetLink: '#', instructorName: 'Dr. Smith', price: 49.99, duration: '4 weeks', status: 'ACTIVE' }
];

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [cRes, mRes] = await Promise.all([fetch(`${API_URL}/courses`), fetch(`${API_URL}/materials`)]);
            if (cRes.ok) setClasses(await cRes.json());
            if (mRes.ok) setMaterials(await mRes.json());
            setIsOfflineMode(false);
        } catch (err) {
            console.warn("Backend offline. Demo mode.");
            setIsOfflineMode(true);
            setClasses(MOCK_CLASSES);
        }
        const saved = localStorage.getItem('zc_user');
        if (saved) setUser(JSON.parse(saved));
    };
    fetchData();
  }, []);

  const setupRecaptcha = (containerId: string) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const sendOtp = async (identifier: string, type: 'email' | 'phone') => {
    if (type === 'phone') {
        try {
            setupRecaptcha('recaptcha-container');
            const appVerifier = window.recaptchaVerifier;
            const formattedPhone = formatPhoneNumber(identifier);
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            window.confirmationResult = confirmationResult;
            return;
        } catch (error: any) {
            console.error("Firebase Phone Error:", error);
            throw new Error(error.message || 'Failed to send SMS');
        }
    } else {
        // Email OTP via Backend
        try {
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, type })
            });
            if (!res.ok) throw new Error('Failed to send Email OTP');
        } catch (e) {
            console.warn("Email OTP Error:", e);
            throw e;
        }
    }
  };

  const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
    // If window.confirmationResult exists, assume it is a phone flow
    if (window.confirmationResult) {
        try {
            await window.confirmationResult.confirm(otp);
            return true;
        } catch (e) {
            console.error("OTP Verification Failed", e);
            return false;
        }
    }

    // Email OTP Verification via Backend
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp })
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      return false;
    }
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        const userData = { ...data, id: data._id || data.id };
        setUser(userData);
        localStorage.setItem('zc_user', JSON.stringify(userData));
    } catch (error) {
        console.error(error);
        throw error;
    } finally { setIsLoading(false); }
  };

  const loginWithPhone = async (phone: string) => {
    setIsLoading(true);
    try {
        const formatted = formatPhoneNumber(phone);
        
        const res = await fetch(`${API_URL}/auth/login-via-phone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: formatted })
        });
        
        if (!res.ok) {
             // Fallback to raw input if formatted fails (legacy data support)
             const resRetry = await fetch(`${API_URL}/auth/login-via-phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone })
            });
            if (!resRetry.ok) throw new Error('Phone Login failed - User not found');
            
            const data = await resRetry.json();
            const userData = { ...data, id: data._id || data.id };
            setUser(userData);
            localStorage.setItem('zc_user', JSON.stringify(userData));
            return;
        }

        const data = await res.json();
        const userData = { ...data, id: data._id || data.id };
        setUser(userData);
        localStorage.setItem('zc_user', JSON.stringify(userData));
    } catch (error) { throw error; }
    finally { setIsLoading(false); }
  };

  const register = async (name: string, email: string, phone: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
        const formattedPhone = formatPhoneNumber(phone);

        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone: formattedPhone, password, role })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        const data = await res.json();
        const userData = { ...data, id: data._id || data.id };
        setUser(userData);
        localStorage.setItem('zc_user', JSON.stringify(userData));
    } catch (error) { throw error; }
    finally { setIsLoading(false); }
  };

  const processPayment = async (details: { courseId: string, amount: number, currency: string, paymentMethod: 'CARD' | 'UPI', upiId?: string }): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);

    try {
        if (isOfflineMode) {
            // Simulate success in offline mode
            setTimeout(() => {
                const updated = { ...user, enrolledCourseIds: [...(user.enrolledCourseIds || []), details.courseId] };
                setUser(updated);
                localStorage.setItem('zc_user', JSON.stringify(updated));
            }, 1000);
            setIsLoading(false);
            return true;
        }

        const res = await fetch(`${API_URL}/payments/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                courseId: details.courseId,
                amount: details.amount,
                currency: details.currency,
                paymentMethod: details.paymentMethod,
                upiId: details.upiId
            })
        });
        
        if (res.ok) {
            const updated = { ...user, enrolledCourseIds: [...(user.enrolledCourseIds || []), details.courseId] };
            setUser(updated);
            localStorage.setItem('zc_user', JSON.stringify(updated));
            setIsLoading(false);
            return true;
        }
        
        setIsLoading(false);
        return false;

    } catch (error) {
        console.error(error);
        setIsLoading(false);
        return false;
    }
  };

  const enroll = async (courseId: string) => {
    if(!user) return false;
    const updated = { ...user, enrolledCourseIds: [...(user.enrolledCourseIds || []), courseId] };
    setUser(updated);
    localStorage.setItem('zc_user', JSON.stringify(updated));
    return true;
  };

  const addClass = async (session: ClassSession) => {
      const { id, ...data } = session;
      await fetch(`${API_URL}/courses`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
      const res = await fetch(`${API_URL}/courses`);
      setClasses(await res.json());
  };
  const updateClass = async (session: ClassSession) => {
      const { id, ...data } = session;
      await fetch(`${API_URL}/courses/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
      const res = await fetch(`${API_URL}/courses`);
      setClasses(await res.json());
  };
  const addMaterial = async (material: CourseMaterial) => {
      const { id, ...data } = material;
      await fetch(`${API_URL}/materials`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
      const res = await fetch(`${API_URL}/materials`);
      setMaterials(await res.json());
  };
  const resetPassword = async (email: string) => { await fetch(`${API_URL}/auth/send-otp`, { method:'POST', body: JSON.stringify({identifier: email, type: 'email'})}) };
  const sendNotification = async (s: string, m: string) => { await fetch(`${API_URL}/notifications`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({subject:s, message:m})}) };
  const deleteUser = async (id: string) => { 
      await fetch(`${API_URL}/users/${id}`, {method:'DELETE'});
      setAllUsers(prev => prev.filter(u => u.id !== id));
  };
  const logout = () => { setUser(null); localStorage.removeItem('zc_user'); };

  return (
    <StoreContext.Provider value={{
      user, login, loginWithPhone, register, resetPassword, logout,
      setupRecaptcha, sendOtp, verifyOtp,
      classes, addClass, updateClass, materials, addMaterial,
      enroll, processPayment, sendNotification, allUsers, deleteUser,
      isLoading, isOfflineMode
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
