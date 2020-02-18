import { JobDefinition } from './types'

export const jobs: JobDefinition[] = [
    {
        name: 'usage_survey_1',
        delayInMinutes: 60 * 24 * 7 * 2,
        job: async ({ notifications }) => {
            await notifications.dispatchNotification('usage_survey_1')
        },
    },
]
