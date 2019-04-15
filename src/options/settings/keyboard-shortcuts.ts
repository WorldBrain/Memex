export interface ShortcutElData {
    id: string
    name: string
    children: string
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
    },
    {
        id: 'create-bm-shortcut',
        name: 'createBookmark',
        children: 'Bookmark current page',
    },
    {
        id: 'add-tag-shortcut',
        name: 'addTag',
        children: 'Add tags to current page (opens picker)',
    },
    {
        id: 'add-comment-shortcut',
        name: 'addComment',
        children: 'Add comment to current page',
    },
]
