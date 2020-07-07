import { storiesOf } from '@storybook/react'
import React from 'react'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { action } from '@storybook/addon-actions'
import { WithDependencies } from 'src/dev/utils'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from 'src/sidebar/annotations-sidebar/components/AnnotationsSidebar'

const DAY_MS = 60000 * 60 * 24
const TAGS = ['tag A', 'tag B', 'tag C', 'tag Z']

async function createDependencies() {
    // const background = await setupBackgroundIntegrationTest()

    const annotations = [
        {
            url: 'test.com#1',
            pageUrl: 'test.com',
            body: 'test highlight from some webpage',
            createdWhen: Date.now() - DAY_MS * 0,
            lastEdited: Date.now() - DAY_MS * 0,
            tags: ['tag A', 'tag B', 'tag C'],
        },
        {
            url: 'test.com#2',
            pageUrl: 'test.com',
            body: 'some other text',
            createdWhen: Date.now() - DAY_MS * 1,
            lastEdited: Date.now() - DAY_MS * 0,
            tags: ['tag B', 'tag Z'],
        },
        {
            url: 'test.com#3',
            pageUrl: 'test.com',
            comment: 'this is a test comment',
            createdWhen: Date.now() - DAY_MS * 2,
            lastEdited: Date.now() - DAY_MS * 2,
            tags: ['tag C'],
        },
        {
            url: 'test.com#4',
            pageUrl: 'test.com',
            body: 'some intetersting text',
            comment: 'Comment and highlight!',
            createdWhen: Date.now() - DAY_MS * 5,
            lastEdited: Date.now() - DAY_MS * 2,
            tags: ['tag A'],
        },
        {
            url: 'test.com#5',
            pageUrl: 'test.com',
            comment: 'this is a test comment',
            createdWhen: Date.now() - DAY_MS * 2,
            lastEdited: Date.now() - DAY_MS * 2,
            tags: ['tag C'],
        },
        {
            url: 'test.com#6',
            pageUrl: 'test.com',
            comment: 'this is a test comment',
            createdWhen: Date.now() - DAY_MS * 2,
            lastEdited: Date.now() - DAY_MS * 2,
            tags: ['tag C'],
        },
    ]

    const sidebarDependencies: AnnotationsSidebarProps = {
        isAnnotationCreateShown: true,
        isSearchLoading: false,
        // displayCrowdfunding: false,
        annotationCreateProps: {
            anchor: null,
            onCancel: action('cancelAnnotationCreate'),
            onSave: action('confirmAnnotationCreate'),
        },
        annotationModes: {
            [annotations[0].url]: 'default',
            [annotations[1].url]: 'default',
            [annotations[2].url]: 'default',
            [annotations[3].url]: 'default',
            [annotations[4].url]: 'edit',
            [annotations[5].url]: 'delete',
        },
        bindAnnotationFooterEventProps: (a) => ({
            onDeleteConfirm: action('confirmDelete'),
            onDeleteCancel: action('cancelDelete'),
            onEditConfirm: action('confirmEdit'),
            onEditCancel: action('cancelEdit'),
            onDeleteIconClick: action('clickDeleteIcon'),
            onEditIconClick: action('clickEditIcon'),
            toggleBookmark: action('toggleBookmark'),
            onGoToAnnotation: action('goToAnnotation'),
        }),
        annotationEditProps: {
            comment: '',
            tags: [],
            isTagInputActive: false,
            onEditConfirm: action('confirmEdit'),
            onCommentChange: action('changeComment'),
            deleteSingleTag: action('deleteSingleTag'),
            setTagInputActive: action('activateTagInput'),
            updateTags: action('updateTags') as any,
        },
        annotationEditableProps: {
            onGoToAnnotation: action('clickAnnotation'),
            onMouseEnter: action('startMouseOver'),
            onMouseLeave: action('endMouseOver'),
        },
        annotationTagProps: {
            loadDefaultSuggestions: async () => TAGS,
            queryEntries: async (query) =>
                TAGS.filter((tag) => tag.startsWith(query)),
        },
        handleScrollPagination: () => undefined,
        onClickOutside: action('clickOutside'),
        annotations,
    }

    return { sidebarDependencies }
}

storiesOf('AnnotationSidebar', module).add('Annotations Sidebar', () => (
    <div>
        <WithDependencies setup={createDependencies}>
            {({ sidebarDependencies }) => (
                <AnnotationsSidebar {...sidebarDependencies} />
            )}
        </WithDependencies>
    </div>
    // )).add('Annotations Sidebar with stateful logic', () => (
    //     <div>
    //         <WithDependencies setup={createDependencies}>
    //             <AnnotationsSidebarContainer  />
    //         </WithDependencies>
    //     </div>
))
