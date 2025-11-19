
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { PaymentModal } from './PaymentModal';
import { AIChat } from '../components/AIChat';
import { ClassSession } from '../types';

export const StudentDashboard: React.FC = () => {
  const { user, classes, materials, enroll } = useStore();
  
  // State for the specific course selected for enrollment
  const [selectedCourse, setSelectedCourse] = useState<ClassSession | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [enrollmentErrors, setEnrollmentErrors] = useState<Record<string, string>>({});

  const isEnrolled = (courseId: string) => {
    return user?.enrolledCourseIds?.includes(courseId) || false;
  };

  // Check if user is enrolled in AT LEAST one course (for generic resource access)
  const hasAnyEnrollment = user?.enrolledCourseIds && user.enrolledCourseIds.length > 0;

  const handleEnrollClick = (course: ClassSession) => {
    setSelectedCourse(course);
    setIsPaymentOpen(true);
    // Clear previous error for this course if any
    if (enrollmentErrors[course.id]) {
        setEnrollmentErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[course.id];
            return newErrors;
        });
    }
  };

  const handleEnrollSuccess = async () => {
    // Logic is now handled by PaymentModal processing the checkout.
    // We just need to close the modal and clear selection.
    // The StoreContext processPayment automatically updates the user state.
    setIsPaymentOpen(false);
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg transition-all">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="opacity-90">
              {hasAnyEnrollment
                ? "Continue your learning journey below."
                : "Explore our premium courses and start learning today."}
            </p>
          </div>
          
          {hasAnyEnrollment ? (
             <div className="flex items-center space-x-2 text-sm font-medium bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30 backdrop-blur-md">
               <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
               <span>Student Account Active</span>
            </div>
          ) : (
             <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
               <p className="font-semibold text-sm">Get Started</p>
               <p className="text-xs opacity-75">Select a course below to enroll.</p>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Classes & Enrollment Cards */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Available Courses & Schedule</h2>
          <div className="space-y-4">
            {classes.map(cls => {
              const enrolled = isEnrolled(cls.id);
              
              return (
                <div key={cls.id} className={`bg-white p-5 rounded-xl shadow-sm border transition-all ${enrolled ? 'border-indigo-200 ring-1 ring-indigo-50' : 'border-gray-100 hover:border-gray-300'}`}>
                   <div className="flex justify-between items-start">
                     <div className="flex-1">
                       {enrolled && <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase bg-indigo-50 px-2 py-1 rounded-full">Enrolled</span>}
                       <h3 className="text-lg font-bold text-gray-900 mt-2">{cls.title}</h3>
                       <p className="text-sm text-gray-500 mt-1">{cls.description}</p>
                       
                       <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                             <span className="mr-1">📅</span>
                             {new Date(cls.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                             <span className="mr-1">⏰</span>
                             {new Date(cls.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          {cls.duration && (
                              <div className="flex items-center">
                                <span className="mr-1">⏳</span>
                                {cls.duration}
                              </div>
                          )}
                       </div>
                     </div>
                     
                     {!enrolled && (
                        <div className="text-right ml-4">
                            <span className="block text-lg font-bold text-gray-900">${cls.price?.toFixed(2) || '0.00'}</span>
                            <span className="text-xs text-gray-400">USD</span>
                        </div>
                     )}
                   </div>

                   <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                     <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-2">Dr</div>
                        <span className="text-sm text-gray-600">{cls.instructorName}</span>
                     </div>
                     
                     {/* Action Button */}
                     <div className="flex flex-col items-end">
                        {enrolled ? (
                          <a 
                            href={cls.meetLink} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Join Class
                          </a>
                        ) : (
                          <Button 
                            onClick={() => handleEnrollClick(cls)}
                            size="sm"
                            className="bg-gray-900 hover:bg-gray-800 text-white shadow-md"
                          >
                            Enroll Now
                          </Button>
                        )}
                        
                        {/* Error Message Display */}
                        {enrollmentErrors[cls.id] && (
                            <div className="mt-2 animate-fadeIn">
                                <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 font-medium">
                                    {enrollmentErrors[cls.id]}
                                </p>
                            </div>
                        )}
                     </div>
                   </div>
                </div>
              );
            })}
            
            {classes.length === 0 && (
                <p className="text-gray-500 italic">No courses currently available.</p>
            )}
          </div>
        </section>

        {/* Course Materials */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shared Resources</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">Files and study materials available to enrolled students.</p>
             </div>
             <ul className="divide-y divide-gray-100">
                {materials.map(mat => (
                  <li key={mat.id} className="p-4 group hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center mr-4 ${mat.type === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                             {mat.type === 'PDF' ? (
                               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                             ) : (
                               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                             )}
                          </div>
                          <div>
                             <h4 className="text-sm font-medium text-gray-900">{mat.title}</h4>
                             <p className="text-xs text-gray-500">{mat.size}</p>
                          </div>
                       </div>
                       
                       {hasAnyEnrollment ? (
                         <Button size="sm" variant="outline" className="text-xs">
                           Download
                         </Button>
                       ) : (
                         <span className="text-xs text-gray-400 flex items-center bg-gray-100 px-2 py-1 rounded">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Locked
                         </span>
                       )}
                    </div>
                  </li>
                ))}
             </ul>
             {!hasAnyEnrollment && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                   <p className="text-xs text-gray-500">Enroll in any course to unlock these resources.</p>
                </div>
             )}
          </div>
        </section>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => { setIsPaymentOpen(false); setSelectedCourse(null); }}
        onSuccess={handleEnrollSuccess}
        price={selectedCourse?.price || 0}
        courseTitle={selectedCourse?.title || 'Course Enrollment'}
        courseId={selectedCourse?.id}
      />
      
      <AIChat />
    </div>
  );
};
