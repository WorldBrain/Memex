export interface ShortcutElData {
    id: string
    name: string
    children: string
    tooltip?: string
    toggleOn?: string
    toggleOff?: string
}

export const shortcuts: ShortcutElData[] = [
    {
        id: 'highlight-shortcut',
        name: 'createHighlight',
        children: 'Highlight selected text',
    },
    {
        id: 'show-highlights-shortcut',
        name: 'toggleHighlights',
        children: 'Toggle visibility of highlights (with no text selected)',
        tooltip: 'Toggle Highlights',
    },
    {
        id: 'sidebar-shortcut',
        name: 'toggleSidebar',
        children: 'Open Sidebar',
        toggleOn: 'Toggle Sidebar',
        toggleOff: 'Open Sidebar',
    },
    {
        id: 'annotation-shortcut',
        name: 'createAnnotation',
        children: 'Create Annotation',
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
        toggleOn: 'Bookmark page',
        toggleOff: 'Remove bookmark',
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
