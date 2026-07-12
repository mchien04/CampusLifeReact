import React, { useState } from 'react';
import UserManagement from './UserManagement';
import StudentAccountManagement from './StudentAccountManagement';
import { motion, AnimatePresence } from 'framer-motion';

const AccountManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'system' | 'student'>('system');

    return (
        <div className="space-y-6">
            {/* Unified Premium Header */}
            <div className="bg-gradient-to-r from-[#001C44] to-[#002A66] rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFD66D] opacity-10 rounded-full blur-2xl -ml-24 -mb-24"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <span className="text-4xl">👥</span>
                            Quản lý tài khoản
                        </h1>
                        <p className="text-gray-200 text-lg">
                            Quản lý tập trung tài khoản hệ thống và sinh viên
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-sm inline-flex">
                        <button
                            onClick={() => setActiveTab('system')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                activeTab === 'system'
                                    ? 'bg-white text-[#001C44] shadow-md scale-105'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            Tài khoản Hệ thống
                        </button>
                        <button
                            onClick={() => setActiveTab('student')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                activeTab === 'student'
                                    ? 'bg-white text-[#001C44] shadow-md scale-105'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            Tài khoản Sinh viên
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content with Animation */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'system' ? (
                        <motion.div
                            key="system"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <UserManagement isNested={true} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="student"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StudentAccountManagement isNested={true} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AccountManagement;
