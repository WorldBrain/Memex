import { API_HOST } from '../analytics/internal/constants'

export const UNINSTALL_URL = `${API_HOST}/uninstall`

/**
 * Percentage of quota usage where we want to warn users with a notification.
 */
export const QUOTA_USAGE_WARN_PERC = 90
