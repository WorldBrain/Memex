import {
    diffTimestamp,
    formatTimestamp,
    normalizeTimestamp,
} from '@worldbrain/memex-common/lib/utils/date-time'

export function formatTime(timestamp, showTime) {
    timestamp = normalizeTimestamp(timestamp)

    const inLastSevenDays = diffTimestamp(Date.now(), timestamp, 'days') <= 7

    if (showTime) {
        return inLastSevenDays
            ? `${formatTimestamp(timestamp, 'ddd HH:mm a ')}`
            : `${formatTimestamp(timestamp, 'D/M/YYYY HH:mm a ')}`
    }
    return inLastSevenDays
        ? formatTimestamp(timestamp, 'ddd')
        : formatTimestamp(timestamp, 'D/M/YYYY')
}
