import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Key, 
  Edit, 
  Trash2, 
  Search, 
  Building, 
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  UserX,
  X
} from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';
import { 
  MAIN_DEPARTMENTS, 
  PEMB_SUB_DEPARTMENTS, 
  isPembDepartment, 
  getPembSubDepartment, 
  formatDepartment 
} from '../../constants/departments';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    bulkDeleteUsers, 
    bulkDeactivateUsers, 
    currentUser, 
    tasks 
  } = useApp();

  const isAdmin = currentUser?.role === 'Administrator' || currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Operations State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeactivateModalOpen, setIsBulkDeactivateModalOpen] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [userDependencies, setUserDependencies] = useState<string[]>([]);

  // Single Delete Confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);
  const [singleDeleteLoading, setSingleDeleteLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: 'User@123',
    role: 'Team Member' as UserRole,
    department: 'L&D',
    subDepartment: '',
    designation: 'L&D Specialist',
    status: 'Active' as 'Active' | 'Inactive',
    avatar: ''
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setValidationError(null);
    setFormData({
      name: '',
      username: '',
      password: 'User@123',
      role: 'Team Member',
      department: 'L&D',
      subDepartment: '',
      designation: 'L&D Specialist',
      status: 'Active',
      avatar: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setValidationError(null);

    const userDept = user.department || 'L&D';
    let mainDept = userDept;
    let subDept = '';

    if (isPembDepartment(userDept)) {
      mainDept = 'PEMB';
      subDept = getPembSubDepartment(userDept) || 'Tekla';
    }

    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || 'User@123',
      role: user.role,
      department: mainDept,
      subDepartment: subDept,
      designation: user.designation,
      status: user.status,
      avatar: user.avatar
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanName = formData.name.trim();
    const cleanUsername = formData.username.trim();

    if (!cleanName) {
      setValidationError('Full Name is required.');
      return;
    }
    if (!cleanUsername) {
      setValidationError('Username is required.');
      return;
    }

    // Duplicate username check
    const usernameExists = users.some(u => 
      u.username.toLowerCase() === cleanUsername.toLowerCase() && (!editingUser || u.id !== editingUser.id)
    );
    if (usernameExists) {
      setValidationError(`The username "${cleanUsername}" is already taken.`);
      return;
    }

    const resolvedDept = formData.department === 'PEMB' && formData.subDepartment
      ? formatDepartment('PEMB', formData.subDepartment)
      : formData.department.trim();

    const payload = {
      name: cleanName,
      username: cleanUsername,
      password: formData.password,
      role: formData.role,
      department: resolvedDept,
      designation: formData.designation,
      status: formData.status,
      avatar: formData.avatar
    };

    setIsSubmitting(true);
    try {
      if (editingUser) {
        const res = await updateUser(editingUser.id, payload);
        if (!res.success) {
          setValidationError(res.error || 'Failed to update user in database.');
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addUser(payload);
        if (!res.success) {
          setValidationError(res.error || 'Failed to create user in database.');
          setIsSubmitting(false);
          return;
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setValidationError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || u.department.toLowerCase().includes(departmentFilter.toLowerCase());
    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  // Selectable users exclude the current logged-in user to prevent accidental self-deletion
  const selectableUsers = filteredUsers.filter(u => u.id !== currentUser.id);
  const selectableIds = selectableUsers.map(u => u.id);

  const isAllVisibleSelected = selectableIds.length > 0 && selectableIds.every(id => selectedUserIds.includes(id));
  const isSomeVisibleSelected = selectableIds.some(id => selectedUserIds.includes(id)) && !isAllVisibleSelected;

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      setSelectedUserIds(prev => prev.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedUserIds(prev => {
        const union = new Set([...prev, ...selectableIds]);
        return Array.from(union);
      });
    }
  };

  const handleToggleUser = (id: string) => {
    if (id === currentUser.id) return;
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  // Open Bulk Delete Modal & Check Dependencies
  const handleOpenBulkDelete = () => {
    if (selectedUserIds.length === 0) return;

    const deps: string[] = [];
    const selected = users.filter(u => selectedUserIds.includes(u.id));

    for (const u of selected) {
      const assignedTasks = (tasks || []).filter(t => t.assignedTo === u.id || t.assignedTo === u.name);
      if (assignedTasks.length > 0) {
        deps.push(`User "${u.name}" (${u.username}) is assigned to ${assignedTasks.length} active task(s). Deleting will remove assignment associations.`);
      }
    }

    setUserDependencies(deps);
    setBulkActionError(null);
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkActionLoading(true);
    setBulkActionError(null);

    const res = await bulkDeleteUsers(selectedUserIds);
    setBulkActionLoading(false);

    if (!res.success) {
      setBulkActionError(res.error || 'Failed to delete selected users from database.');
    } else {
      setSelectedUserIds([]);
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Open Bulk Deactivate Modal
  const handleOpenBulkDeactivate = () => {
    if (selectedUserIds.length === 0) return;
    setBulkActionError(null);
    setIsBulkDeactivateModalOpen(true);
  };

  const handleConfirmBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkActionLoading(true);
    setBulkActionError(null);

    const res = await bulkDeactivateUsers(selectedUserIds);
    setBulkActionLoading(false);

    if (!res.success) {
      setBulkActionError(res.error || 'Failed to deactivate selected users.');
    } else {
      setSelectedUserIds([]);
      setIsBulkDeactivateModalOpen(false);
    }
  };

  // Single User Delete Confirm
  const handleConfirmSingleDelete = async () => {
    if (!userToDelete) return;
    setSingleDeleteLoading(true);
    setSingleDeleteError(null);

    const res = await deleteUser(userToDelete.id);
    setSingleDeleteLoading(false);

    if (!res.success) {
      setSingleDeleteError(res.error || 'Failed to delete user.');
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userToDelete.id));
      setUserToDelete(null);
    }
  };

  const rolesList: UserRole[] = [
    'Administrator',
    'L&D Lead',
    'L&D Specialist',
    'Trainer',
    'Auditor',
    'Executive',
    'Management',
    'Team Member',
    'Trainee'
  ];

  return (
    <div className="space-y-6" id="user-management-view">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department User Management</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage user accounts, system roles, designations, and permissions for CADEPLOY L&D.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-new-user"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-users-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search users by name, username, role, or designation..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="filter-users-role"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Roles</option>
            {rolesList.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            id="filter-users-department"
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Departments</option>
            {MAIN_DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            id="filter-users-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-2">
            Total: <span className="font-bold text-slate-800 dark:text-white">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar for Administrator */}
      {selectedUserIds.length > 0 && (
        <div 
          className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
          id="users-bulk-action-bar"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs">
              <CheckSquare className="w-3.5 h-3.5" />
              <span id="selected-users-count">Selected: {selectedUserIds.length}</span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {selectedUserIds.length === 1 ? '1 user selected' : `${selectedUserIds.length} users selected`}
            </span>
            <button
              onClick={handleToggleSelectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              id="btn-toggle-all-visible-users"
            >
              {isAllVisibleSelected ? 'Deselect visible' : `Select all visible (${selectableIds.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              id="btn-clear-user-selection"
            >
              Clear Selection
            </button>

            {/* Administrator Only Bulk Deactivate */}
            {isAdmin && (
              <button
                onClick={handleOpenBulkDeactivate}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-bulk-deactivate-users"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Deactivate Selected ({selectedUserIds.length})</span>
              </button>
            )}

            {/* Administrator Only Bulk Delete */}
            {isAdmin && (
              <button
                onClick={handleOpenBulkDelete}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-bulk-delete-users"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedUserIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {/* Select All Checkbox */}
                {isAdmin && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      id="select-all-users-checkbox"
                      checked={isAllVisibleSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeVisibleSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      disabled={selectableIds.length === 0}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer disabled:opacity-40"
                      title={isAllVisibleSelected ? "Deselect all visible" : "Select all visible"}
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department & Designation</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-400">
                    No users match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  const isSelected = selectedUserIds.includes(u.id);

                  return (
                    <tr 
                      key={u.id} 
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-blue-50/60 dark:bg-blue-950/30' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Row Selection Checkbox */}
                      {isAdmin && (
                        <td className="py-3.5 px-3 text-center">
                          {isCurrent ? (
                            <span title="You cannot select your own account for bulk deletion" className="text-slate-300 dark:text-slate-600 cursor-not-allowed">
                              —
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              id={`select-user-${u.id}`}
                              checked={isSelected}
                              onChange={() => handleToggleUser(u.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer"
                            />
                          )}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} size="lg" className="w-9 h-9 border border-slate-200 dark:border-slate-700" />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] rounded font-medium">You</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900">
                          <Shield className="w-3 h-3 text-blue-600" />
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{u.designation}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          {u.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {u.createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Edit User"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!isCurrent && (
                              <button
                                onClick={() => {
                                  setSingleDeleteError(null);
                                  setUserToDelete(u);
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. jdoe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {rolesList.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        department: val,
                        subDepartment: val === 'PEMB' && !formData.subDepartment ? 'Tekla' : formData.subDepartment
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {MAIN_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Training Manager"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.department === 'PEMB' && (
                <div>
                  <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    PEMB Sub-Division <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subDepartment || 'Tekla'}
                    onChange={e => setFormData({ ...formData, subDepartment: e.target.value })}
                    className="w-full px-3 py-2 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 rounded-lg text-xs text-blue-900 dark:text-blue-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PEMB_SUB_DEPARTMENTS.map(sub => (
                      <option key={sub} value={sub}>PEMB - {sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Save User Changes' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete User Account</h3>
                <p className="text-xs text-slate-500 font-mono">@{userToDelete.username}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete user <span className="font-semibold text-slate-900 dark:text-white">{userToDelete.name}</span> ({userToDelete.designation})? This action cannot be undone.
            </p>

            {singleDeleteError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs">
                {singleDeleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={singleDeleteLoading}
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {singleDeleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Delete {selectedUserIds.length} Selected User{selectedUserIds.length === 1 ? '' : 's'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator Bulk Operation • Supabase Database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300">
                <p className="font-semibold mb-1">Permanent Deletion Warning</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  You are about to permanently delete <span className="font-bold">{selectedUserIds.length}</span> user accounts from the database. This action cannot be reversed.
                </p>
              </div>

              {/* Dependencies warning if any */}
              {userDependencies.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Task Associations Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px]">
                    {userDependencies.map((dep, idx) => (
                      <li key={idx}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Selected Users List */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selected User Accounts ({selectedUserIds.length})
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {users
                    .filter(u => selectedUserIds.includes(u.id))
                    .map(u => (
                      <div 
                        key={u.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} size="md" className="w-7 h-7" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                            <span className="text-slate-400 font-mono text-[11px] ml-1.5">(@{u.username})</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          {u.role}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {bulkActionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {bulkActionError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {bulkActionLoading ? 'Deleting Users...' : `Delete ${selectedUserIds.length} Users`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Deactivate Modal */}
      {isBulkDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Deactivate {selectedUserIds.length} Selected User{selectedUserIds.length === 1 ? '' : 's'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator Bulk Operation • Sets Status to Inactive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkDeactivateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Are you sure you want to deactivate <span className="font-bold text-slate-900 dark:text-white">{selectedUserIds.length}</span> user accounts? Inactive users cannot log in or be assigned new training activities.
              </p>

              {/* Selected Users List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {users
                  .filter(u => selectedUserIds.includes(u.id))
                  .map(u => (
                    <div 
                      key={u.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={u.name} size="md" className="w-7 h-7" />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                          <span className="text-slate-400 font-mono text-[11px] ml-1.5">(@{u.username})</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.status}
                      </span>
                    </div>
                  ))}
              </div>

              {bulkActionError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  {bulkActionError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBulkDeactivateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkActionLoading}
                onClick={handleConfirmBulkDeactivate}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {bulkActionLoading ? 'Deactivating Users...' : `Deactivate ${selectedUserIds.length} Users`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
