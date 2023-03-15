const currentDate = new Date(Date.now())
const currentMonth = currentDate.getMonth()

export const COUNTER_STORAGE_KEY = '@status'
export const DEFAULT_COUNTER_STORAGE_KEY = { s: 50, c: 0, m: currentMonth }
export const FREE_PLAN_LIMIT = 100
export const PRO_PLAN_LIMIT = 300
