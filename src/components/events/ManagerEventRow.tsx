import React from 'react';
import { Link } from 'react-router-dom';
import {
    CalendarBlank,
    MapPin,
    Ticket,
    Eye,
    PencilSimple,
    Copy,
    Trash,
} from '@phosphor-icons/react';
import { ActivityResponse } from '../../types/activity';
import EventBannerImage from './EventBannerImage';
import { formatTicketQuantity } from '../../utils/ticketUtils';
import {
    formatEventDate,
    getActivityTypeLabel,
    getEventScoreSummary,
    ACTIVITY_TYPE_BADGE,
} from '../../utils/eventDisplayUtils';

export interface ManagerEventStatusInfo {
    label: string;
    className: string;
    description?: string;
}

interface ManagerEventRowProps {
    event: ActivityResponse;
    status: ManagerEventStatusInfo;
    isDraft?: boolean;
    onCopy: () => void;
    onDelete: () => void;
    deleting?: boolean;
}

const actionBtn =
    'inline-flex items-center justify-center rounded-lg p-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 active:scale-95';

export const ManagerEventRow: React.FC<ManagerEventRowProps> = ({
    event,
    status,
    isDraft = false,
    onCopy,
    onDelete,
    deleting = false,
}) => {
    const typeBadgeClass = event.type
        ? ACTIVITY_TYPE_BADGE[event.type]
        : 'bg-gray-50 text-gray-700 border-gray-200';

    return (
        <article
            className={`group flex flex-col gap-2 rounded-xl border bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-primary-900/10 min-w-0 sm:flex-row sm:gap-3 ${
                isDraft ? 'border-amber-200 border-dashed bg-amber-50/20' : 'border-gray-100'
            }`}
        >
            <div className="flex min-w-0 flex-1 gap-3">
                <Link
                    to={`/manager/events/${event.id}`}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-900 sm:h-16 sm:w-16"
                >
                <EventBannerImage
                    bannerUrl={event.bannerUrl}
                    alt=""
                    wrapperClassName="absolute inset-0"
                    imageClassName="h-full w-full object-cover"
                />
            </Link>

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start gap-2 min-w-0">
                    <Link
                        to={`/manager/events/${event.id}`}
                        className="text-sm font-semibold text-primary-900 leading-snug line-clamp-2 hover:underline min-w-0"
                    >
                        {event.name}
                    </Link>
                    {event.isImportant && (
                        <span className="shrink-0 rounded bg-accent/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-900">
                            QT
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-1">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${status.className}`}>
                        {status.label}
                    </span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeBadgeClass}`}>
                        {getActivityTypeLabel(event.type)}
                    </span>
                    <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-900 truncate max-w-[8rem]">
                        {getEventScoreSummary(event)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1 tabular-nums shrink-0">
                        <CalendarBlank size={12} className="shrink-0" />
                        {formatEventDate(event.startDate)}
                    </span>
                    {event.location && (
                        <span className="inline-flex items-center gap-1 min-w-0 truncate max-w-[10rem]">
                            <MapPin size={12} className="shrink-0" />
                            {event.location}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 shrink-0">
                        <Ticket size={12} className="shrink-0" />
                        {formatTicketQuantity(event.ticketQuantity)}
                    </span>
                </div>
            </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-0.5 sm:items-start">
                <Link
                    to={`/manager/events/${event.id}`}
                    className={`${actionBtn} bg-primary-900 text-white hover:bg-primary-800`}
                    title="Chi tiết"
                >
                    <Eye size={16} weight="bold" />
                </Link>
                <Link
                    to={`/manager/events/${event.id}/edit`}
                    className={`${actionBtn} text-gray-600 hover:bg-gray-100`}
                    title="Sửa"
                >
                    <PencilSimple size={16} weight="bold" />
                </Link>
                <button type="button" onClick={onCopy} className={`${actionBtn} text-gray-600 hover:bg-gray-100`} title="Sao chép">
                    <Copy size={16} weight="bold" />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className={`${actionBtn} text-red-600 hover:bg-red-50 disabled:opacity-50`}
                    title={deleting ? 'Đang xóa...' : 'Xóa'}
                >
                    <Trash size={16} weight="bold" />
                </button>
            </div>
        </article>
    );
};

export default ManagerEventRow;
