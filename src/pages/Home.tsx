import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { CaretRight, Calendar, Users, Trophy, TrendUp, Compass } from '@phosphor-icons/react';
import { articleAPI } from '../services/articleAPI';
import type { ArticleListResponse } from '../types/article';

const Home: React.FC = () => {
    const [articles, setArticles] = useState<ArticleListResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await articleAPI.getPublicArticlesList({ status: 'published', size: 6 });
                if (res.status && res.body?.content) {
                    setArticles(res.body.content);
                }
            } catch (error) {
                console.error('Failed to fetch articles', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    const FADE_UP: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
    };

    const STAGGER: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-[#001C44] selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-stone-50/80 backdrop-blur-xl border-b border-stone-200/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-[#001C44] rounded-xl flex items-center justify-center">
                            <span className="text-[#FFD66D] font-black text-lg">CL</span>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-[#001C44]">Campus Life</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="text-sm font-bold text-stone-600 hover:text-[#001C44] transition-colors"
                        >
                            Dành cho Quản trị viên
                        </Link>
                        <Link
                            to="/login"
                            className="bg-[#001C44] text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-[#002A66] transition-all active:scale-95 shadow-sm hover:shadow"
                        >
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-24 md:pt-40 md:pb-32 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
                    <motion.div 
                        initial="hidden" 
                        animate="show" 
                        variants={STAGGER}
                        className="max-w-2xl"
                    >
                        <motion.div variants={FADE_UP} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-200/50 border border-stone-300/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-600">Nền tảng sinh viên</span>
                        </motion.div>
                        <motion.h1 
                            variants={FADE_UP}
                            className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[#001C44] leading-[1.05] mb-6"
                        >
                            Quản lý toàn diện <br className="hidden md:block" />
                            <span className="text-stone-400">trải nghiệm đại học.</span>
                        </motion.h1>
                        <motion.p 
                            variants={FADE_UP}
                            className="text-lg text-stone-600 leading-relaxed mb-10 max-w-lg"
                        >
                            Hệ thống quản lý sự kiện và điểm rèn luyện thông minh. 
                            Kết nối sinh viên, tổ chức sự kiện chuyên nghiệp và theo dõi quá trình phát triển cá nhân.
                        </motion.p>
                        <motion.div variants={FADE_UP} className="flex flex-wrap items-center gap-4">
                            <Link
                                to="/login"
                                className="bg-[#001C44] text-[#FFD66D] px-8 py-4 rounded-2xl text-base font-extrabold hover:bg-[#002A66] hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-[#001C44]/20 flex items-center gap-2"
                            >
                                Bắt đầu ngay
                                <CaretRight weight="bold" />
                            </Link>
                            <Link
                                to="#articles"
                                className="bg-white text-[#001C44] border border-stone-200 px-8 py-4 rounded-2xl text-base font-bold hover:bg-stone-50 transition-all flex items-center gap-2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Xem sự kiện
                                <Compass weight="bold" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative lg:ml-auto w-full max-w-xl aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl bg-stone-200"
                    >
                        <img 
                            src="/images/campus-life.jpg" 
                            alt="Campus Life" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 border border-black/5 rounded-[2rem] pointer-events-none"></div>
                    </motion.div>
                </div>
            </main>

            {/* Features Bento */}
            <section className="py-24 bg-white border-y border-stone-200/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#001C44] mb-4">
                            Mọi thứ bạn cần cho một nhiệm kỳ thành công.
                        </h2>
                        <p className="text-stone-600 text-lg">
                            Công cụ quản lý mạnh mẽ, tự động hóa điểm rèn luyện và xây dựng cộng đồng sinh viên vững mạnh.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Big Feature */}
                        <div className="md:col-span-2 bg-stone-50 rounded-3xl p-8 md:p-10 border border-stone-200 flex flex-col justify-between group hover:border-stone-300 transition-colors">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-8 text-[#001C44]">
                                <Calendar size={28} weight="fill" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-stone-900 mb-3">Quản lý sự kiện thông minh</h3>
                                <p className="text-stone-600 leading-relaxed max-w-md">
                                    Từ việc lập kế hoạch, duyệt nội dung đến điểm danh bằng QR Code. 
                                    Mọi công đoạn đều được số hóa hoàn toàn.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#001C44] rounded-3xl p-8 md:p-10 flex flex-col justify-between group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-[#FFD66D] backdrop-blur-sm">
                                <Trophy size={28} weight="fill" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-3">Điểm rèn luyện</h3>
                                <p className="text-[#FFD66D]/80 leading-relaxed">
                                    Tự động cộng điểm và xếp loại học kỳ chính xác, minh bạch.
                                </p>
                            </div>
                        </div>

                        <div className="bg-stone-50 rounded-3xl p-8 md:p-10 border border-stone-200 flex flex-col justify-between group hover:border-stone-300 transition-colors">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-8 text-[#001C44]">
                                <Users size={28} weight="fill" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-stone-900 mb-3">Phân quyền đa tầng</h3>
                                <p className="text-stone-600 leading-relaxed">
                                    Quản lý truy cập an toàn cho Admin, Ban Tổ Chức và Sinh viên.
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-stone-50 rounded-3xl p-8 md:p-10 border border-stone-200 flex flex-col justify-between group hover:border-stone-300 transition-colors">
                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-8 text-[#001C44]">
                                <TrendUp size={28} weight="fill" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-stone-900 mb-3">Báo cáo & Thống kê</h3>
                                <p className="text-stone-600 leading-relaxed max-w-md">
                                    Xuất báo cáo dưới dạng biểu đồ trực quan, hỗ trợ quyết định nhanh chóng và hiệu quả.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Articles Section */}
            <section id="articles" className="py-24 bg-stone-100 border-b border-stone-200/50 min-h-[500px]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-[#001C44] mb-3">Tin tức & Sự kiện</h2>
                            <p className="text-stone-500">Những hoạt động mới nhất đang diễn ra.</p>
                        </div>
                        <Link to="/articles" className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[#001C44] hover:text-blue-600 transition-colors group">
                            Xem tất cả 
                            <CaretRight weight="bold" className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse bg-white rounded-3xl h-[380px] border border-stone-200/80"></div>
                            ))}
                        </div>
                    ) : articles.length > 0 ? (
                        <motion.div 
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.1 }}
                            variants={STAGGER}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {articles.map((article) => (
                                <motion.div 
                                    variants={FADE_UP} 
                                    key={article.id} 
                                    className="bg-white rounded-3xl border border-stone-200 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden">
                                        {article.thumbnailUrl ? (
                                            <img 
                                                src={article.thumbnailUrl} 
                                                alt={article.title} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-100">
                                                <Compass size={48} weight="thin" />
                                            </div>
                                        )}
                                        {article.articleType && (
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-[#001C44]">
                                                {article.articleType}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        {article.publishedAt && (
                                            <div className="text-xs font-bold text-stone-400 mb-3">
                                                {new Date(article.publishedAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        )}
                                        <h3 className="text-lg font-bold text-stone-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#001C44] transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-stone-500 text-sm line-clamp-2 mb-6 flex-grow">
                                            {article.seoDescription || 'Cập nhật những thông tin mới nhất về sự kiện này...'}
                                        </p>
                                        <Link 
                                            to={`/articles/${article.slug}`}
                                            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#001C44] hover:text-blue-600 transition-colors"
                                        >
                                            Đọc tiếp
                                            <CaretRight weight="bold" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-stone-200">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                                <Compass size={32} />
                            </div>
                            <p className="text-stone-500 font-medium">Chưa có bài viết nào được đăng tải.</p>
                        </div>
                    )}

                    <div className="mt-8 text-center sm:hidden">
                        <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-bold text-[#001C44] px-6 py-3 rounded-xl border border-stone-200 bg-white">
                            Xem tất cả sự kiện <CaretRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-16 border-t border-stone-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-stone-900 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xs">CL</span>
                            </div>
                            <span className="text-lg font-extrabold text-stone-900">Campus Life</span>
                        </div>
                        <div className="text-stone-400 text-sm font-medium">
                            &copy; 2026 Campus Life. Nền tảng quản lý sinh viên thế hệ mới.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
