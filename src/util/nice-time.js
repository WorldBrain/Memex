
function hourString(date) {
    // return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
    return `${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`
}

function dayString(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[date.getDay()]
}

function monthString(date) {
    const months = ['Jan', 'Feb', 'March', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
    return months[date.getMonth()]
}

// Get something nicely readable - at least to my personal taste.
export default function niceTime(date, {now = undefined} = {}) {
    const then = new Date(date)
    now = now || new Date()
    const secondsAgo = (now - then) / 1000
    if (secondsAgo < -60 * 60 * 24) {
        return 'in the future?!'
    }
    if (secondsAgo < -60) {
        return 'soon?!'
    }
    if (secondsAgo < 90) { return 'now' }
    if (secondsAgo < 60 * 10) { return `${Math.round(secondsAgo / 60)} minutes ago` }
    if (secondsAgo < 60 * 60) { return `${Math.round(secondsAgo / 60 / 5) * 5} minutes ago` }
    if (secondsAgo < 60 * 60 * 24
        && (now.getDay() == then.getDay() || secondsAgo < 60 * 60 * 6)) { return hourString(then) }
    if (secondsAgo < 60 * 60 * 24) { return `Yesterday ${hourString(then)}` }
    if (secondsAgo < 60 * 60 * 24 * 3) { return `${dayString(then)} ${hourString(then)}` }
    if (then.getYear() === now.getYear()) { return `${then.getDate()} ${monthString(then)}` }
    return `${then.getDate()} ${monthString(then)} ${then.getFullYear()}`
}
