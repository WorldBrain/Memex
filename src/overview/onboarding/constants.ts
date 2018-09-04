import { FeatureInfo } from './types'

export const IMPORT_CONN_NAME = 'imports-onboarding-runtime-connection'
export const NUM_IMPORT_ITEMS = 30
export const STORAGE_KEYS = {
    isImportsDone: 'is-onboarding-done',
    progress: 'onboarding-import-progress',
}

export const FEATURES_INFO: FeatureInfo[] = [
    {
        heading: 'Power Search',
        subheading:
            'Find any word of any website you visited, and apply powerful filters.',
        url: 'https://worldbrain.io',
    },
    {
        heading: 'Web Annotation & Comments',
        subheading:
            'Add your thoughts to websites and specific pieces of text in them.',
        url: 'https://worldbrain.io',
    },
    {
        heading: 'Sharing links to text highlights',
        subheading:
            'Show people specific pieces of text in any website. With just one click.',
        url: 'https://worldbrain.io',
    },
    {
        heading: 'Bookmarks & Tags',
        subheading:
            "Favorite pages, tag them, and sync with your browser's bookmarks.",
        url: 'https://worldbrain.io',
    },
    {
        heading: 'Collections',
        subheading:
            'Automatic local indexing of all content of all pages you visit.',
        url: 'https://worldbrain.io',
    },
]
