import React from 'react';
import { ActivityResponse } from '../../types/activity';
import EventBannerImage from './EventBannerImage';
import { formatTicketQuantity } from '../../utils/ticketUtils';
import {
    formatEventDate,
    getActivityTypeLabel,
    getEventScoreSummary,
    isEventDraft,
    ACTIVITY_TYPE_BADGE,
} from '../../utils/eventDisplayUtils';

interface EventListCardProps {
    event: ActivityResponse;
    statusBadge?: React.ReactNode;
    topOverlay?: React.ReactNode;
    extraTags?: React.ReactNode;
    registrationBadge?: React.ReactNode;
    footer: React.ReactNode;
}

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
        <span className="text-gray-500 shrink-0">{label}</span>
        <span className="text-gray-900 font-medium text-right truncate">{value}</span>
    </div>
);

export const EventListCard: React.FC<EventListCardProps> = ({
    event,
    statusBadge,
    topOverlay,
    extraTags,
    registrationBadge,
    footer,
}) => {
    const isDraft = isEventDraft(event);
    const typeBadgeClass = event.type
        ? ACTIVITY_TYPE_BADGE[event.type]
        : 'bg-gray-50 text-gray-700 border-gray-200';

    return (
        <article
            className={`group relative flex flex-col h-full rounded-2xl border bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover hover:-translate-y-0.5 overflow-hidden ${
                isDraft ? 'border-amber-300 border-dashed' : 'border-gray-100'
            }`}
        >
            {topOverlay}

            <EventBannerImage
                bannerUrl={event.bannerUrl}
                alt={`Banner ${event.name}`}
                wrapperClassName={`relative h-44 sm:h-48 bg-gray-100 overflow-hidden shrink-0 ${isDraft ? 'opacity-75' : ''}`}
                imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />

            <div className="flex flex-col flex-1 p-5">
                <header className="mb-4">
                    <div className="flex items-start gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-primary-900 leading-snug line-clamp-2">
                            {event.name}
                        </h3>
                        {event.isImportant && (
                            <span
                                className="shrink-0 mt-0.5 rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-900"
                                title="Sự kiện quan trọng"
                            >
                                Quan trọng
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {statusBadge}
                        <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${typeBadgeClass}`}>
                            {getActivityTypeLabel(event.type)}
                        </span>
                        <span className="inline-flex items-center rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1 text-xs font-medium text-primary-900">
                            {getEventScoreSummary(event)}
                        </span>
                        {extraTags}
                    </div>
                </header>

                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">
                    {event.description || 'Chưa có mô tả'}
                </p>

                <div className="rounded-xl bg-gray-50/80 px-4 py-3 mb-4 divide-y divide-gray-100/80">
                    <MetaRow label="Bắt đầu" value={formatEventDate(event.startDate)} />
                    <MetaRow label="Kết thúc" value={formatEventDate(event.endDate)} />
                    {event.location && <MetaRow label="Địa điểm" value={event.location} />}
                    <MetaRow label="Số vé" value={formatTicketQuantity(event.ticketQuantity)} />
                    {event.participantCount != null && event.participantCount > 0 && (
                        <MetaRow
                            label="Tham gia"
                            value={<span className="tabular-nums">{event.participantCount}</span>}
                        />
                    )}
                </div>

                {(event.mandatoryForFacultyStudents || event.requiresApproval) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {event.mandatoryForFacultyStudents && (
                            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                                Bắt buộc khoa
                            </span>
                        )}
                        {event.requiresApproval && (
                            <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md px-2 py-1">
                                Cần duyệt
                            </span>
                        )}
                    </div>
                )}

                {registrationBadge}

                <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    {footer}
                </div>
            </div>
        </article>
    );
};

export default EventListCard;
