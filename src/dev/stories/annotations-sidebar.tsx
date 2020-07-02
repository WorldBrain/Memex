import { storiesOf } from '@storybook/react'
import { EventEmitter } from 'events'
import React from 'react'

import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { action } from '@storybook/addon-actions'
import { WithDependencies } from 'src/dev/utils'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from 'src/sidebar/annotations-sidebar/components/AnnotationsSidebar'
import { AnnotationsSidebarEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

const DAY_MS = 60000 * 60 * 24
const TAGS = ['tag A', 'tag B', 'tag C', 'tag Z']

async function createDependencies() {
    // const background = await setupBackgroundIntegrationTest()
    const events = new EventEmitter() as AnnotationsSidebarEventEmitter

    events.on('queryAnnotations', action('onSearch'))
    events.on('removeTemporaryHighlights', action('removeTempHighlights'))
    events.on('clickAnnotationDeleteBtn', action('clickDeleteBtn'))
    events.on('clickAnnotationTag', action('clickAnnotationTag'))
    events.on('clickAnnotationBookmarkBtn', action('toggleBookmark'))
    events.on('clickAnnotationDeleteBtn', action('deleteAnnotation'))
    events.on('clickAnnotationEditBtn', action('editAnnotation'))
    events.on(
        'clickCancelAnnotationCreateBtn',
        action('cancelAnnotationCreate'),
    )
    events.on(
        'clickConfirmAnnotationCreateBtn',
        action('confirmAnnotationCreate'),
    )
    events.on('clickAnnotationTagBtn', action('clickAnnotationTagBtn'))
    events.on('changeAnnotationQuery', action('changeAnnotationQuery'))
    events.on('clickAnnotation', action('goToAnnotation'))
    events.on('startAnnotationHover', action('mouseEnter'))
    events.on('endAnnotationHover', action('mouseLeave'))

    const tagPickerDependencies: GenericPickerDependenciesMinusSave = {
        loadDefaultSuggestions: async () => [],
        queryEntries: async () => [],
        actOnAllTabs: async () => null,
        onEscapeKeyDown: async () => null,
        initialSelectedEntries: () => [],
    }

    const sidebarDependencies: AnnotationsSidebarProps = {
        env: 'inpage',
        mode: 'default',
        events,
        isAnnotationCreateShown: true,
        isSearchLoading: false,
        // displayCrowdfunding: false,
        annotationTagProps: {
            fetchInitialTagSuggestions: async () => TAGS,
            queryTagSuggestions: async (query) =>
                TAGS.filter((tag) => tag.startsWith(query)),
        },
        annotationCreateProps: {
            anchor: null,
            tagPickerDependencies,
        },

        annotations: [
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
                tags: [],
            },
            {
                url: 'test.com#4',
                pageUrl: 'test.com',
                body: 'some intetersting text',
                comment: 'Comment and highlight!',
                createdWhen: Date.now() - DAY_MS * 5,
                lastEdited: Date.now() - DAY_MS * 2,
                tags: [],
            },
        ],
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
))
