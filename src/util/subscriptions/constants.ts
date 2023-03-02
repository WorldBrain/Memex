const currentDate = new Date(Date.now())
const currentMonth = currentDate.getMonth()

export const COUNTER_STORAGE_KEY = '@status'
export const DEFAULT_COUNTER_STORAGE_KEY = { s: '100', c: 0, m: currentMonth }
