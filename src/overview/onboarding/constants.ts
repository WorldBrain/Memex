import { FeatureInfo } from './types'

export const IMPORT_CONN_NAME = 'imports-onboarding-runtime-connection'
export const NUM_IMPORT_ITEMS = 30
export const STORAGE_KEYS = {
    isImportsDone: 'is-onboarding-done',
    progress: 'onboarding-import-progress',
}

export const FEATURES_INFO: FeatureInfo[] = [
    {
        heading: 'Search your memory',
        subheading:
            'Find any word of any website you visited, and apply powerful filters.',
        url: 'https://worldbrain.io/onboarding-search',
    },
    {
        heading: 'Web Annotation & Comments',
        subheading:
            'Add your thoughts to websites and specific pieces of text in them.',
        url: 'https://worldbrain.io/onboarding-annotations',
    },
    {
        heading: 'Sharing links to text highlights',
        subheading:
            'Show people specific pieces of text in any website. With just one click.',
        url: 'https://worldbrain.io/onboarding-memex-link',
    },
    {
        heading: 'Bookmarks & Tags',
        subheading:
            "Favorite pages, tag them, and sync with your browser's bookmarks.",
        url: 'https://worldbrain.io/onboarding-bookmarks',
    },
    {
        heading: 'Collections',
        subheading: 'Sort websites in useful lists',
        url: 'https://worldbrain.io/onboarding-collections',
    },
]
