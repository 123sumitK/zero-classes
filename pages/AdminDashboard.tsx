
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserRole, ClassSession } from '../types';

export const AdminDashboard: React.FC = () => {
  const { allUsers, classes, addClass, updateClass, deleteUser } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'settings'>('users');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // New/Edit Course State
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState<Partial<ClassSession>>({
    title: '',
    description: '',
    instructorName: '',
    date: '',
    meetLink: '',
    price: 0,
    duration: '',
    status: 'ACTIVE'
  });

  // Filter State
  const [selectedInstructor, setSelectedInstructor] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        deleteUser(id);
    }
  };

  const handleEditClick = (course: ClassSession) => {
    setNewCourse(course);
    setEditingId(course.id);
    setIsAddingCourse(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArchiveClick = (course: ClassSession) => {
      if (confirm(`Are you sure you want to archive "${course.title}"?`)) {
          updateClass({ ...course, status: 'ARCHIVED' });
      }
  };

  const handleCreateOrUpdateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.date || !newCourse.meetLink || !newCourse.instructorName) return;
    
    // Safe ID Generator (Fallback for non-secure contexts)
    const generateId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    const courseData = {
        title: newCourse.title!,
        description: newCourse.description || '',
        date: newCourse.date!,
        meetLink: newCourse.meetLink!,
        instructorName: newCourse.instructorName!,
        price: Number(newCourse.price) || 0,
        duration: newCourse.duration,
        status: newCourse.status || 'ACTIVE'
    };

    if (editingId) {
        updateClass({
            id: editingId,
            ...courseData
        });
    } else {
        addClass({
            id: generateId(),
            ...courseData
        });
    }
    
    setNewCourse({ title: '', description: '', instructorName: '', date: '', meetLink: '', price: 0, duration: '', status: 'ACTIVE' });
    setEditingId(null);
    setIsAddingCourse(false);
  };

  const toggleCourseForm = () => {
    if (isAddingCourse) {
        setIsAddingCourse(false);
        setEditingId(null);
        setNewCourse({ title: '', description: '', instructorName: '', date: '', meetLink: '', price: 0, duration: '', status: 'ACTIVE' });
    } else {
        setIsAddingCourse(true);
    }
  };

  // Derived Data for Filters
  const uniqueInstructors = Array.from(new Set(classes.map(c => c.instructorName)));
  
  const filteredClasses = classes.filter(cls => {
    const matchesInstructor = selectedInstructor === 'ALL' || cls.instructorName === selectedInstructor;
    
    let matchesStatus = true;
    if (selectedStatus !== 'ALL') {
        // Use explicit status field if available, otherwise fallback to date logic for older records
        const currentStatus = cls.status || (new Date(cls.date) < new Date() ? 'ARCHIVED' : 'ACTIVE');
        matchesStatus = currentStatus === selectedStatus;
    }

    return matchesInstructor && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-600">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-500">System overview and user management.</p>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'courses' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('courses')}
        >
          Course Overview
        </button>
        <button 
          className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('settings')}
        >
          System Settings
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
             <h3 className="text-lg font-medium text-gray-900">Registered Users ({allUsers.length})</h3>
             <Button size="sm" variant="outline">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.map(u => (
                        <tr key={u.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{u.email}</div>
                                <div className="text-xs text-gray-500">{u.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 
                                      u.role === UserRole.INSTRUCTOR ? 'bg-emerald-100 text-emerald-800' : 
                                      'bg-blue-100 text-blue-800'}`}>
                                    {u.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {u.role === UserRole.STUDENT ? (
                                    u.enrolledCourseIds && u.enrolledCourseIds.length > 0 ? <span className="text-green-600">Premium</span> : <span className="text-gray-400">Free Tier</span>
                                ) : (
                                    <span className="text-gray-400">Active</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {u.role !== UserRole.ADMIN && (
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Active Courses</h3>
                <Button onClick={toggleCourseForm} variant={isAddingCourse ? 'secondary' : 'primary'}>
                    {isAddingCourse ? 'Cancel' : 'Add New Course'}
                </Button>
             </div>

             {isAddingCourse && (
                 <div className="bg-white border border-purple-200 rounded-lg p-6 animate-fadeIn shadow-sm">
                     <h4 className="text-md font-bold text-gray-900 mb-4">{editingId ? 'Edit Course Details' : 'Create New Course Session'}</h4>
                     <form onSubmit={handleCreateOrUpdateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input 
                            label="Course Title" 
                            placeholder="e.g. Advanced Algorithms"
                            value={newCourse.title}
                            onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                            required
                        />
                        <Input 
                            label="Instructor Name" 
                            placeholder="e.g. Dr. Smith"
                            value={newCourse.instructorName}
                            onChange={e => setNewCourse({...newCourse, instructorName: e.target.value})}
                            required
                        />
                        <div className="md:col-span-2">
                            <Input 
                                label="Description" 
                                placeholder="Course overview..."
                                value={newCourse.description}
                                onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                            />
                        </div>
                        <Input 
                            label="Date & Time" 
                            type="datetime-local"
                            value={newCourse.date}
                            onChange={e => setNewCourse({...newCourse, date: e.target.value})}
                            required
                        />
                        <Input 
                            label="Google Meet Link" 
                            placeholder="https://meet.google.com/..."
                            value={newCourse.meetLink}
                            onChange={e => setNewCourse({...newCourse, meetLink: e.target.value})}
                            required
                        />
                        <Input 
                            label="Price (USD)" 
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="49.99"
                            value={newCourse.price}
                            onChange={e => setNewCourse({...newCourse, price: parseFloat(e.target.value) || 0})}
                        />
                        <Input 
                            label="Duration" 
                            placeholder="e.g. 8 weeks"
                            value={newCourse.duration || ''}
                            onChange={e => setNewCourse({...newCourse, duration: e.target.value})}
                        />
                        <div className="md:col-span-2 flex justify-end mt-2">
                            <Button type="submit" className="w-full md:w-auto">{editingId ? 'Update Course' : 'Create Course'}</Button>
                        </div>
                     </form>
                 </div>
             )}

             {/* Filter Bar */}
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="w-full md:w-48">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Instructor</label>
                         <select 
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 outline-none"
                            value={selectedInstructor}
                            onChange={(e) => setSelectedInstructor(e.target.value)}
                         >
                             <option value="ALL">All Instructors</option>
                             {uniqueInstructors.map(inst => (
                                 <option key={inst} value={inst}>{inst}</option>
                             ))}
                         </select>
                    </div>
                    <div className="w-full md:w-48">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Status</label>
                         <select 
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 outline-none"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                         >
                             <option value="ALL">All Statuses</option>
                             <option value="ACTIVE">Active (Upcoming)</option>
                             <option value="ARCHIVED">Archived</option>
                         </select>
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    Showing {filteredClasses.length} results
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {filteredClasses.length === 0 && !isAddingCourse && (
                     <div className="col-span-2 text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                         <p className="text-gray-500">No courses found matching your filters.</p>
                     </div>
                 )}
                 
                 {filteredClasses.map(cls => {
                     const isArchived = cls.status === 'ARCHIVED';
                     return (
                     <div key={cls.id} className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between transition-colors ${isArchived ? 'opacity-75 bg-gray-50' : 'hover:border-purple-300'}`}>
                         <div>
                             <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{cls.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${isArchived ? 'bg-gray-200 text-gray-600' : 'bg-purple-100 text-purple-800'}`}>
                                    {isArchived ? 'Archived' : 'Active'}
                                </span>
                             </div>
                             <p className="text-sm text-gray-500 mb-1">Instructor: <span className="font-medium text-gray-700">{cls.instructorName}</span></p>
                             <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                             
                             <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="w-4 mr-2 text-center">🗓</span>
                                        <span>{new Date(cls.date).toLocaleDateString()}</span>
                                    </div>
                                    <span className="font-semibold text-gray-700">{cls.price ? `$${cls.price.toFixed(2)}` : 'Free'}</span>
                                </div>
                                {cls.duration && (
                                    <div className="flex items-center">
                                        <span className="w-4 mr-2 text-center">⏳</span>
                                        <span>{cls.duration}</span>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <span className="w-4 mr-2 text-center">🔗</span>
                                    <a href={cls.meetLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline truncate block max-w-[200px]">{cls.meetLink}</a>
                                </div>
                             </div>
                         </div>
                         <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                             <span className="text-xs text-gray-400">ID: {cls.id.substring(0, 8)}...</span>
                             <div className="flex space-x-2">
                                 {!isArchived && (
                                     <Button size="sm" variant="secondary" onClick={() => handleArchiveClick(cls)}>Archive</Button>
                                 )}
                                 <Button size="sm" variant="outline" onClick={() => handleEditClick(cls)}>Edit</Button>
                             </div>
                         </div>
                     </div>
                 )})}
             </div>
        </div>
      )}

      {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-6">System Configuration</h3>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                      <div>
                          <p className="font-medium text-gray-900">Maintenance Mode</p>
                          <p className="text-sm text-gray-500">Disable access for all students temporarily.</p>
                      </div>
                      <button 
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${maintenanceMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${maintenanceMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                      <div>
                          <p className="font-medium text-gray-900">Allow Public Registrations</p>
                          <p className="text-sm text-gray-500">If disabled, only admins can add new users.</p>
                      </div>
                      <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600">
                          <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 translate-x-5 transition duration-200 ease-in-out" />
                      </div>
                  </div>

                  <div>
                      <p className="font-medium text-gray-900 mb-2">System Database</p>
                      <div className="flex space-x-3">
                          <Button variant="secondary" size="sm">Backup Data</Button>
                          <Button variant="danger" size="sm">Reset All Data</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
