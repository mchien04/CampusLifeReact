export const toDateTimeLocal = (iso?: string): string => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export const fromDateTimeLocal = (value?: string): string | undefined => {
    if (!value) return undefined;
    // Assume value like 'YYYY-MM-DDTHH:mm' and return ISO string
    const dt = new Date(value);
    return dt.toISOString();
};


