import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SubmenuItem {
    name: string;
    href: string;
    icon?: React.ReactNode;
}

interface SubmenuProps {
    title: string;
    icon: React.ReactNode;
    items: SubmenuItem[];
    isOpen?: boolean;
    sidebarOpen: boolean;
}

const Submenu: React.FC<SubmenuProps> = ({ title, icon, items, isOpen: defaultOpen = false, sidebarOpen }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const location = useLocation();

    const isActive = (href: string) => {
        return location.pathname.startsWith(href);
    };

    const hasActiveItem = items.some(item => isActive(item.href));

    // Auto-open if has active item
    React.useEffect(() => {
        if (hasActiveItem && !isOpen) {
            setIsOpen(true);
        }
    }, [hasActiveItem, isOpen]);

    if (!sidebarOpen) {
        return (
            <li>
                <div className="flex items-center justify-center px-4 py-3 text-gray-300">
                    {icon}
                </div>
            </li>
        );
    }

    return (
        <li>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    hasActiveItem
                        ? 'bg-[#FFD66D] bg-opacity-20 text-[#FFD66D] border-l-4 border-[#FFD66D]'
                        : 'text-gray-300 hover:bg-[#002A66] hover:text-white border-l-4 border-transparent'
                }`}
            >
                <div className="flex items-center">
                    <span className="mr-3">{icon}</span>
                    <span>{title}</span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <ul className="mt-1 space-y-1 pl-8">
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        active
                                            ? 'bg-[#FFD66D] bg-opacity-20 text-[#FFD66D]'
                                            : 'text-gray-400 hover:bg-[#002A66] hover:text-white'
                                    }`}
                                >
                                    {item.icon && <span className="mr-2 w-4 h-4">{item.icon}</span>}
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
};

export default Submenu;

