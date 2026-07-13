import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/eventAPI';
import { minigameAPI } from '../services/minigameAPI';
import { registrationAPI } from '../services/registrationAPI';
import { ActivityResponse, ActivityType } from '../types/activity';
import { MiniGame } from '../types/minigame';
import { RegistrationStatus } from '../types/registration';
import { LoadingSpinner } from '../components/common';
import { QuizCard } from '../components/minigame';
import StudentLayout from '../components/layout/StudentLayout';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, GameController } from '@phosphor-icons/react';

const StudentMinigame: React.FC = () => {
    const navigate = useNavigate();
    const [minigames, setMinigames] = useState<Array<{ minigame: MiniGame; activity: ActivityResponse }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ONGOING' | 'UPCOMING' | 'ENDED'>('ONGOING');
    const [attemptsMap, setAttemptsMap] = useState<Map<number, boolean>>(new Map());
    const [attemptCountsMap, setAttemptCountsMap] = useState<Map<number, number>>(new Map());
    const [registrationStatuses, setRegistrationStatuses] = useState<Map<number, RegistrationStatus | null>>(new Map());

    useEffect(() => {
        loadMinigames();
    }, []);

    const loadMinigames = async () => {
        try {
            setLoading(true);
            // Get all activities with type MINIGAME
            const eventsResponse = await eventAPI.getEvents();
            if (eventsResponse.status && eventsResponse.data) {
                const minigameActivities = eventsResponse.data.filter(
                    a => a.type === ActivityType.MINIGAME
                );

                const minigameData: Array<{ minigame: MiniGame; activity: ActivityResponse }> = [];

                for (const activity of minigameActivities) {
                    try {
                        // Load registration status for this activity
                        let registrationStatus: RegistrationStatus | null = null;
                        try {
                            const registrationData = await registrationAPI.checkRegistrationStatus(activity.id);
                            if (registrationData) {
                                registrationStatus = registrationData.status;
                            }
                        } catch (regErr) {
                            console.warn(`Error checking registration for activity ${activity.id}:`, regErr);
                            // Continue without registration status
                        }
                        setRegistrationStatuses(prev => new Map(prev.set(activity.id, registrationStatus)));

                        const minigameResponse = await minigameAPI.getMiniGameByActivity(activity.id);
                        if (minigameResponse.status && minigameResponse.data) {
                            minigameData.push({
                                minigame: minigameResponse.data,
                                activity
                            });

                            // Check if student has attempts and count them
                            const attemptsResponse = await minigameAPI.getMyAttempts(minigameResponse.data.id);
                            if (attemptsResponse.status && attemptsResponse.data) {
                                const attemptCount = attemptsResponse.data.length;
                                if (attemptCount > 0) {
                                    setAttemptsMap(prev => new Map(prev.set(activity.id, true)));
                                }
                                setAttemptCountsMap(prev => new Map(prev.set(activity.id, attemptCount)));
                            }
                        }
                    } catch (err) {
                        console.error(`Error loading minigame for activity ${activity.id}:`, err);
                    }
                }

                setMinigames(minigameData);
            } else {
                setError(eventsResponse.message || 'Không thể tải danh sách minigame');
            }
        } catch (err) {
            setError('Có lỗi xảy ra khi tải danh sách minigame');
            console.error('Error loading minigames:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = (activityId: number) => {
        navigate(`/student/minigames/${activityId}/play`);
    };

    const filteredMinigames = minigames.filter(({ minigame, activity }) => {
        const matchesSearch =
            minigame.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            minigame.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.name.toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!matchesSearch) return false;
        
        const now = new Date();
        const start = new Date(activity.startDate);
        const end = new Date(activity.endDate);
        
        if (activeTab === 'ONGOING') {
            return now >= start && now <= end;
        }
        if (activeTab === 'UPCOMING') {
            return now < start;
        }
        if (activeTab === 'ENDED') {
            return now > end;
        }
        return true;
    });

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <LoadingSpinner />
                </div>
            </StudentLayout>
        );
    }

    if (error) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-[#001C44] mb-2">Có lỗi xảy ra</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={loadMinigames}
                            className="btn-primary px-6 py-3 rounded-lg font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="mx-auto max-w-6xl space-y-6 pb-12">
                <header className="relative overflow-hidden rounded-2xl border border-primary-900/10 bg-primary-900 px-6 py-7 sm:px-8 text-white shadow-premium">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.12]"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse at 0% 0%, #FFD66D 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, #4b88b6 0%, transparent 50%)',
                        }}
                    />
                    <div className="relative">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent/90">
                            Thử thách Mini Game
                        </p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                            Khám phá & Nhận thưởng
                        </h1>
                        <p className="mt-2 text-sm text-primary-100/90 max-w-2xl leading-relaxed">
                            Kiểm tra kiến thức của bạn, tham gia các bài quiz thú vị và tích lũy điểm thưởng một cách dễ dàng.
                        </p>
                    </div>
                </header>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl border border-gray-200/50 w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {(['ONGOING', 'UPCOMING', 'ENDED'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    activeTab === tab
                                        ? 'bg-white text-primary-900 shadow-sm border border-gray-200/50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                            >
                                {tab === 'ONGOING' ? 'Đang diễn ra' : tab === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <MagnifyingGlass weight="bold" className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm quiz, hoạt động, mô tả..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-900/20 focus:border-primary-900 transition-all shadow-sm text-sm"
                        />
                    </div>
                </div>

                {/* Minigames List - Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMinigames.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 border-dashed break-inside-avoid">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <GameController weight="duotone" className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Không có minigame {activeTab === 'ONGOING' ? 'đang diễn ra' : activeTab === 'UPCOMING' ? 'sắp diễn ra' : 'nào'}</h3>
                            <p className="text-gray-500 text-center max-w-sm">
                                Thử thay đổi từ khóa tìm kiếm hoặc quay lại sau nhé.
                            </p>
                        </div>
                    ) : (
                        filteredMinigames.map(({ minigame, activity }) => {
                            const registrationStatus = registrationStatuses.get(activity.id);
                            // Với MINIGAME, ATTENDED cũng được coi là đã đăng ký (cho phép làm quiz lại)
                            const isRegistered = registrationStatus === RegistrationStatus.APPROVED || 
                                                registrationStatus === RegistrationStatus.PENDING ||
                                                registrationStatus === RegistrationStatus.ATTENDED;
                            
                            return (
                                <div key={minigame.id} className="h-full">
                                    <QuizCard
                                        minigame={minigame}
                                        activity={activity}
                                        onStart={handleStart}
                                        hasAttempts={attemptsMap.get(activity.id) || false}
                                        attemptCount={attemptCountsMap.get(activity.id) || 0}
                                        isRegistered={isRegistered}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentMinigame;

