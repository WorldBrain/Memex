import { storeTrackingOption } from '../analytics/store-tracking-option'

export const actionRegistry = {
    'toggle-storage-option': ({ definition }) => {
        storeTrackingOption(definition.value)
    },
    'go-to-url': ({ definition }) => {
        return () => {
            window.location.href = definition.url
        }
    },
}
