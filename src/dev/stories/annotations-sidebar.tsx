import { storiesOf } from '@storybook/react'
import React from 'react'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from 'src/sidebar-annotations/components/sidebar'
import mapValues from 'lodash/mapValues'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

async function createDependencies() {
    const background = await setupBackgroundIntegrationTest()

    const annotations = mapValues(
        background.backgroundModules.directLinking.remoteFunctions,
        (f) => {
            return (...args: any[]) => {
                return f({ tab: currentTab }, ...args)
            }
        },
    )
    const sidebarDependencies: AnnotationsSidebarProps = {
        highlighter: {
            removeHighlights: async () => {},
            removeTempHighlights: async () => {},
            removeAnnotationHighlights: async () => {},
            renderHighlights: async () => {},
            renderHighlight: async () => {},
            scrollToHighlight: async () => {},
            highlightAndScroll: async () => {},
        } as any,
        searchResultLimit: 10,
        getRemoteFunction: () => async () => {},
        setSidebarEnabled: async () => {},
        normalizeUrl: (url) => url,
        tags: background.backgroundModules.tags.remoteFunctions,
        customLists: background.backgroundModules.customLists.remoteFunctions,
        activityLogger:
            background.backgroundModules.activityLogger.remoteFunctions,
        annotations,
        tooltip: {
            getState: async () => true,
            setState: async () => undefined,
        },
        highlights: {
            getState: async () => true,
            setState: async () => undefined,
        },
    }
}

storiesOf('AnnotationSidebar', module).add('Annotations Sidebar', () => (
    <div>
        <AnnotationsSidebar {...sidebarDependencies} />
    </div>
))
