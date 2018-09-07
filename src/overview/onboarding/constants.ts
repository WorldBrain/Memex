import { FeatureInfo } from './types'

export const IMPORT_CONN_NAME = 'imports-onboarding-runtime-connection'
export const NUM_IMPORT_ITEMS = 30
export const STORAGE_KEYS = {
    isImportsDone: 'is-onboarding-done',
    progress: 'onboarding-import-progress',
}

export const FEATURES_INFO: FeatureInfo[] = [
    {
        heading: 'Add Web Annotation & Comments',
        subheading: 'Add notes to websites and highlighted text in them.',
        url: 'https://worldbrain.io/onboarding-annotations',
    },
    {
        heading: 'Powersearch your Browser History',
        subheading: 'Find past websites even if you only remember a few words.',
        url: 'https://worldbrain.io/onboarding-search',
    },
    {
        heading: 'Linking to paragraphs.',
        subheading:
            'Show anyone specific pieces of text in any website via a url.',
        url: 'https://worldbrain.io/onboarding-memex-link',
    },
    {
        heading: 'Bookmarks & Tags',
        subheading: "Favorite & tag pages, and sync your browser's bookmarks.",
        url: 'https://worldbrain.io/onboarding-bookmarks',
    },
    {
        heading: 'Collections',
        subheading: 'Sort websites in useful lists',
        url: 'https://worldbrain.io/onboarding-collections',
    },
]
