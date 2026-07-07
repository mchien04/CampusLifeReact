/** null / undefined / 0 = không giới hạn (theo API & form unlimited) */
export function isUnlimitedTickets(ticketQuantity?: number | null): boolean {
    return ticketQuantity == null || ticketQuantity <= 0;
}

export function formatTicketQuantity(ticketQuantity?: number | null): string {
    if (isUnlimitedTickets(ticketQuantity)) return 'Không giới hạn';
    return `${ticketQuantity} vé`;
}

export function formatTicketQuantityLabel(ticketQuantity?: number | null): string {
    if (isUnlimitedTickets(ticketQuantity)) return 'Không giới hạn';
    return String(ticketQuantity);
}
