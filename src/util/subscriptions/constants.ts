const currentDate = new Date(Date.now())
const currentMonth = currentDate.getMonth()

export const COUNTER_STORAGE_KEY = '@status'
export const OPEN_AI_API_KEY = '@openAIKey'
export const DEFAULT_COUNTER_STORAGE_KEY = {
    c: 0,
    cQ: 0,
    m: currentMonth,
    pU: {},
}
export const FREE_PLAN_LIMIT = 25
export const PRO_PLAN_LIMIT = 300
export const AI_SUMMARY_URLS = '@aiSummaryURLs'

export const DEFAULT_POWERUP_LIMITS = {
    bookmarksPowerUp: 25,
    AIpowerup: 25,
}
