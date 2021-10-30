import React from 'react'

export interface ShortcutElData {
    id: string
    name: string
    text: React.ReactNode
    subText?: React.ReactNode
    tooltip?: string
    toggleOn?: string
    toggleOff?: string
}

export const shortcuts: ShortcutElData[] = [
    {
        id: 'highlight-shortcut',
        name: 'createHighlight',
        text: 'Highlight selected text',
        subText: (
            <>
                +<strong>Shift</strong> to share
            </>
        ),
    },
    {
        id: 'annotation-shortcut',
        name: 'createAnnotation',
        text: 'Annotate selected text',
        subText: (
            <>
                +<strong>Shift</strong> to share
            </>
        ),
    },
    {
        id: 'add-comment-shortcut',
        name: 'addComment',
        text: 'Add note to current page',
        tooltip: 'Add note to page',
    },
    {
        id: 'open-dashboard-shortcut',
        name: 'openDashboard',
        text: 'Open Dashboard',
        tooltip: 'Search Memex',
    },
    {
        id: 'show-highlights-shortcut',
        name: 'toggleHighlights',
        text: 'Toggle visibility of highlights (with no text selected)',
        tooltip: 'Toggle Highlights',
    },
    {
        id: 'sidebar-shortcut',
        name: 'toggleSidebar',
        text: 'Open Sidebar',
        toggleOn: 'Toggle Sidebar',
        toggleOff: 'Open Sidebar',
    },
    {
        id: 'add-to-coll-shortcut',
        name: 'addToCollection',
        text: 'Add current page to collection (opens picker)',
        tooltip: 'Add page to collections',
    },
    {
        id: 'create-bm-shortcut',
        name: 'createBookmark',
        text: 'Bookmark Page',
        toggleOn: 'Bookmark Page',
        toggleOff: 'Un-Bookmark Page',
    },
    {
        id: 'add-tag-shortcut',
        name: 'addTag',
        text: 'Add tags to current page (opens picker)',
        tooltip: 'Add tags to page',
    },
]
