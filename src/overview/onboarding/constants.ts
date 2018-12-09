import { FeatureInfo } from './types'

export const IMPORT_CONN_NAME = 'imports-onboarding-runtime-connection'
export const NUM_IMPORT_ITEMS = 30
export const ANNOTATION_DEMO_URL = 'https://en.wikipedia.org/wiki/Memex'
export const STORAGE_KEYS = {
    isImportsDone: 'is-onboarding-done',
    progress: 'onboarding-import-progress',
    onboardingDemo: {
        step1: 'step-one-annotations',
    },
}

export const FEATURES_INFO: FeatureInfo[] = [
    {
        heading: 'Add notes to websites',
        subheading: 'Comment on, highlight and annotate your web',
        url: 'https://worldbrain.io/onboarding-annotations',
    },
    {
        heading: 'Full-Text Search your History ',
        subheading: 'And filter by time, domain, tags or bookmarks',
        url: 'https://worldbrain.io/onboarding-search',
    },
    {
        heading: 'Share URLs to highlighted text',
        subheading: 'Show others specific pieces of text in any website',
        url: 'https://worldbrain.io/onboarding-memex-link',
    },
    {
        heading: 'Flexibly organise',
        subheading: 'Bookmark, tag & and sort websites into lists',
        url: 'https://worldbrain.io/onboarding-collections',
    },
]
