
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ClassSession, CourseMaterial } from '../types';

export const InstructorDashboard: React.FC = () => {
  const { classes, addClass, materials, addMaterial, sendNotification, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'uploads' | 'announcements'>('schedule');
  
  // Form States
  const [newClass, setNewClass] = useState<Partial<ClassSession>>({ title: '', date: '', meetLink: '', description: '' });
  const [newFile, setNewFile] = useState<{ name: string, size: number } | null>(null);

  // Announcement State
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);

  // Safe ID Generator
  const generateSafeId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.title || !newClass.date || !newClass.meetLink) return;
    
    addClass({
      id: generateSafeId(),
      instructorName: 'Dr. Sarah Smith',
      title: newClass.title!,
      description: newClass.description || '',
      date: newClass.date!,
      meetLink: newClass.meetLink!,
      status: 'ACTIVE'
    });
    
    setNewClass({ title: '', date: '', meetLink: '', description: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile({ 
        name: e.target.files[0].name,
        size: e.target.files[0].size
      });
    }
  };

  const confirmUpload = () => {
    if (!newFile) return;
    
    const fileName = newFile.name.toLowerCase();
    let fileType: 'PDF' | 'DOC' | 'SLIDE' | 'VIDEO' = 'DOC'; // Default

    if (fileName.endsWith('.pdf')) {
      fileType = 'PDF';
    } else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      fileType = 'SLIDE';
    } else if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi')) {
      fileType = 'VIDEO';
    }

    const material: CourseMaterial = {
      id: generateSafeId(),
      title: newFile.name,
      type: fileType,
      size: (newFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      url: '#',
      uploadedAt: new Date().toISOString()
    };
    
    addMaterial(material);
    setNewFile(null);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementSubject || !announcementMessage) return;

    await sendNotification(announcementSubject, announcementMessage);
    
    setNotificationSent(true);
    setAnnouncementSubject('');
    setAnnouncementMessage('');
    
    setTimeout(() => setNotificationSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h2>
        <p className="text-gray-500">Manage your curriculum and resources.</p>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'schedule' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('schedule')}
        >
          Class Schedule
        </button>
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'uploads' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('uploads')}
        >
          Material Uploads
        </button>
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'announcements' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
             <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                 <h3 className="text-lg font-medium text-gray-900">Upcoming Classes</h3>
               </div>
               <ul className="divide-y divide-gray-200">
                 {classes.map(cls => (
                   <li key={cls.id} className="p-4 hover:bg-gray-50">
                     <div className="flex justify-between items-start">
                       <div>
                         <h4 className="text-base font-semibold text-gray-900">{cls.title}</h4>
                         <p className="text-sm text-gray-500">{cls.description}</p>
                         <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="mr-4">📅 {new Date(cls.date).toLocaleDateString()}</span>
                            <span>⏰ {new Date(cls.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                       </div>
                       <a href={cls.meetLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center bg-indigo-50 px-3 py-1 rounded-full">
                         Google Meet ↗
                       </a>
                     </div>
                   </li>
                 ))}
                 {classes.length === 0 && (
                   <li className="p-8 text-center text-gray-500">No classes scheduled yet.</li>
                 )}
               </ul>
             </div>
          </div>

          <div className="lg:col-span-1">
            <form onSubmit={handleCreateClass} className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule New Class</h3>
              <Input 
                label="Topic" 
                placeholder="e.g., Advanced CSS" 
                value={newClass.title}
                onChange={e => setNewClass({...newClass, title: e.target.value})}
                required
              />
              <Input 
                label="Description" 
                placeholder="Brief overview..." 
                value={newClass.description}
                onChange={e => setNewClass({...newClass, description: e.target.value})}
              />
              <Input 
                label="Date & Time" 
                type="datetime-local" 
                value={newClass.date}
                onChange={e => setNewClass({...newClass, date: e.target.value})}
                required
              />
              <Input 
                label="Google Meet Link" 
                placeholder="https://meet.google.com/..." 
                value={newClass.meetLink}
                onChange={e => setNewClass({...newClass, meetLink: e.target.value})}
                required
              />
              <Button type="submit" className="w-full">Create Schedule</Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'uploads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             <div className="bg-white shadow rounded-lg overflow-hidden">
               <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                 <h3 className="text-lg font-medium text-gray-900">Uploaded Materials</h3>
               </div>
               <ul className="divide-y divide-gray-200">
                 {materials.map(mat => (
                   <li key={mat.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                     <div className="flex items-center">
                       <div className={`h-10 w-10 rounded-lg flex items-center justify-center mr-3 ${mat.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                         {mat.type === 'PDF' ? 'PDF' : 'DOC'}
                       </div>
                       <div>
                         <h4 className="text-sm font-medium text-gray-900">{mat.title}</h4>
                         <p className="text-xs text-gray-500">{mat.size} • {new Date(mat.uploadedAt).toLocaleDateString()}</p>
                       </div>
                     </div>
                     <Button variant="outline" size="sm">View</Button>
                   </li>
                 ))}
               </ul>
             </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
               <h3 className="text-lg font-medium text-gray-900">Upload Resource</h3>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                 <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                 />
                 {!newFile ? (
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="mt-1 text-sm text-indigo-600 hover:text-indigo-500">Click to select file</p>
                      <p className="text-xs text-gray-500">PDF, DOC, PPT up to 10MB</p>
                    </label>
                 ) : (
                    <div className="text-left">
                       <p className="text-sm font-medium text-gray-900 truncate">{newFile.name}</p>
                       <p className="text-xs text-gray-500">{(newFile.size / 1024).toFixed(1)} KB</p>
                       <div className="mt-4 flex space-x-2">
                          <Button size="sm" onClick={confirmUpload} className="w-full">Confirm</Button>
                          <Button size="sm" variant="secondary" onClick={() => setNewFile(null)}>Cancel</Button>
                       </div>
                    </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
             <div className="border-b border-gray-100 pb-4 mb-4">
               <h3 className="text-lg font-bold text-gray-900">Send Class Notifications</h3>
               <p className="text-sm text-gray-500">Send email/SMS updates to all enrolled students.</p>
             </div>

             {notificationSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center animate-fadeIn">
                   <svg className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                   <p className="text-green-800 font-medium">Notification Sent Successfully!</p>
                   <p className="text-green-600 text-sm">All students have been notified via email.</p>
                </div>
             ) : (
               <form onSubmit={handleSendNotification} className="space-y-4">
                  <Input 
                    label="Subject" 
                    placeholder="e.g., Class Rescheduled: React Patterns"
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32 resize-none"
                      placeholder="Enter your message here..."
                      value={announcementMessage}
                      onChange={(e) => setAnnouncementMessage(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be sent to all registered student email addresses.</p>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                       <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                       </svg>
                       Send Notification
                    </Button>
                  </div>
               </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
