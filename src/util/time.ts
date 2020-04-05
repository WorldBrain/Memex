import moment from 'moment'

export function formatTime(timestamp, showTime) {
    const m = moment(timestamp)
    const inLastSevenDays = moment().diff(m, 'days') <= 7

    if (showTime) {
        return inLastSevenDays
            ? `${m.format('ddd HH:mm a ')}`
            : `${m.format('D/M/YYYY HH:mm a ')}`
    }
    return inLastSevenDays ? m.format('ddd') : m.format('D/M/YYYY')
}
