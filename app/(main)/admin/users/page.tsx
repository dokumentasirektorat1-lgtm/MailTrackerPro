'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/firebase/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

export default function AdminUsersPage() {
    const { profile: currentUserProfile } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const querySnapshot = await getDocs(usersRef);

            const usersList: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                usersList.push(doc.data() as UserProfile);
            });

            // Sort by createdAt (newest first)
            usersList.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setUsers(usersList);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        if (!confirm('Approve User? This user will gain access to the system.')) return;

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                approvedBy: currentUserProfile?.uid,
            });

            toast.success('User Approved!', {
                description: 'The user can now access the system.'
            });

            fetchUsers();
        } catch (error: any) {
            toast.error('Approval Failed', {
                description: error.message
            });
        }
    };

    const handleReject = async (userId: string) => {
        if (!confirm('Reject User? This user will be denied access to the system.')) return;

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                status: 'rejected',
            });

            toast.success('User Rejected', {
                description: 'The user has been denied access.'
            });

            fetchUsers();
        } catch (error: any) {
            toast.error('Rejection Failed', {
                description: error.message
            });
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
        if (!confirm(`Change User Role? Change role to ${newRole}?`)) {
            // Re-fetch users to reset select value if canceled (or handle state locally)
            fetchUsers();
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: newRole });

            toast.success('Role Updated!', {
                description: `User role changed to ${newRole}.`
            });

            fetchUsers();
        } catch (error: any) {
            toast.error('Update Failed', {
                description: error.message
            });
            fetchUsers();
        }
    };

    const filteredUsers = users.filter((user) => {
        if (filter === 'all') return true;
        return user.status === filter;
    });

    if (loading) {
        return (
            <ProtectedRoute requireAdmin>
                <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                    <div className="loader"></div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requireAdmin>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">User Management</h1>
                    <p className="text-slate-600 dark:text-slate-400">Approve, reject, and manage user access</p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6 animate-slide-up transition-colors duration-300">
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${filter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {status} ({users.filter((u) => status === 'all' || u.status === status).length})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up transition-colors duration-300" style={{ animationDelay: '0.1s' }}>
                    {filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p>No users found with status: {filter}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Name</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Email</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Role</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Status</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Created</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-slate-900 dark:text-white">{user.displayName}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                                            <td className="p-4">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.uid, e.target.value as 'user' | 'admin')}
                                                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="p-4">
                                                {user.status === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
                                                )}
                                                {user.status === 'approved' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</span>
                                                )}
                                                {user.status === 'rejected' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {user.status !== 'approved' && (
                                                        <button
                                                            onClick={() => handleApprove(user.uid)}
                                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {user.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => handleReject(user.uid)}
                                                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
