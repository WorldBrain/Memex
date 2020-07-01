import { storiesOf } from '@storybook/react'
import React from 'react'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { action } from '@storybook/addon-actions'
import { WithDependencies } from 'src/dev/utils'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from 'src/sidebar/annotations-sidebar/components/AnnotationsSidebar'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'

const DAY_MS = 60000 * 60 * 24
const TAGS = ['tag A', 'tag B', 'tag C', 'tag Z']

async function createDependencies() {
    // const background = await setupBackgroundIntegrationTest()

    const tagPickerDependencies: GenericPickerDependenciesMinusSave = {
        loadDefaultSuggestions: async () => [],
        queryEntries: async () => [],
        actOnAllTabs: async () => null,
        onEscapeKeyDown: async () => null,
        initialSelectedEntries: () => [],
    }

    const sidebarDependencies: AnnotationsSidebarProps = {
        annotationTagProps: {
            fetchInitialTagSuggestions: async () => TAGS,
            queryTagSuggestions: async (query) =>
                TAGS.filter((tag) => tag.startsWith(query)),
        },
        annotationCreateProps: {
            anchor: null,
            onCancel: action('onCancel'),
            onSave: action('onSave'),
            tagPickerDependencies,
        },
        annotationEditProps: {
            env: 'inpage',
            mode: 'default',
            displayCrowdfunding: false,
            highlighter: {
                removeTempHighlights: action('removeTempHighlights'),
            },
            handleAnnotationModeSwitch: action('switchMode'),
            handleAnnotationTagClick: action('clickAnnotationTag'),
            handleBookmarkToggle: action('toggleBookmarks'),
            handleDeleteAnnotation: action('deleteAnnotation'),
            handleEditAnnotation: action('editAnnotation'),
            handleGoToAnnotation: action('goToAnnotation'),
            handleMouseEnter: action('mouseEnter'),
            handleMouseLeave: action('mouseLeave'),
        },
        isAnnotationCreateShown: true,
        isSearchLoading: 'pristine',
        onSearch: action('onSearch'),
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
