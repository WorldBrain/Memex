import { string } from 'prop-types'

export interface ShortcutElData {
    id: string
    name: string
    children: string
    tooltip?: string
    turnOn?: string
    turnOff?: string
}

export const shortcuts: ShortcutElData[] = [
    { id: 'link-shortcut', name: 'link', children: 'Create links' },
    {
        id: 'highlight-shortcut',
        name: 'highlight',
        children: 'Highlight selected text',
    },
    {
        id: 'show-highlights-shortcut',
        name: 'toggleHighlights',
        children: 'Toggle visibility of highlights (with no text selected)',
        tooltip: 'Toggle highlights',
    },
    {
        id: 'sidebar-shortcut',
        name: 'toggleSidebar',
        children: 'Toggle sidebar',
    },
    {
        id: 'annotation-shortcut',
        name: 'createAnnotation',
        children: 'Create annotation',
    },
    {
        id: 'add-to-coll-shortcut',
        name: 'addToCollection',
        children: 'Add current page to collection (opens picker)',
        tooltip: 'Add page to collections',
    },
    {
        id: 'create-bm-shortcut',
        name: 'createBookmark',
        children: 'Star current page',
        turnOn: 'Star page',
        turnOff: 'Unstar page',
    },
    {
        id: 'add-tag-shortcut',
        name: 'addTag',
        children: 'Add tags to current page (opens picker)',
        tooltip: 'Add tags to page',
    },
    {
        id: 'add-comment-shortcut',
        name: 'addComment',
        children: 'Add comment to current page',
        tooltip: 'Add notes to page',
    },
]
