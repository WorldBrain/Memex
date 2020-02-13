import { browser } from 'webextension-polyfill-ts'

import createNotification from 'src/util/notifications'

export interface Job {
    name: string
    job: () => Promise<void> | void
    periodInMinutes?: number
    delayInMinutes?: number
}

export const jobs: Job[] = [
    {
        name: 'usage-survey',
        delayInMinutes: 60 * 24 * 7 * 3,
        job: async () => {
            await createNotification(
                {
                    requireInteraction: true,
                    isClickable: true,
                    title: 'Take a 2-5min survey',
                    message:
                        'Get 1 month free premium and a chance to win 12 months!',
                },
                () =>
                    browser.tabs.create({
                        url: 'https://worldbrain.typeform.com/to/PHt3uZ',
                    }),
            )
        },
    },
]
