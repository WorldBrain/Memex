import { storiesOf } from '@storybook/react'
import React from 'react'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import AnnotationsManager from 'src/annotations/annotations-manager'
import RibbonContainer from 'src/in-page-ui/ribbon/react/containers/ribbon'
import SidebarContainer from 'src/in-page-ui/sidebar/react/containers/sidebar'
import { WithDependencies } from '../utils'
import { ResultsByUrl } from 'src/overview/types'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { RibbonController } from 'src/in-page-ui/ribbon'
import { SidebarController } from 'src/in-page-ui/sidebar'
import { SidebarEnv } from 'src/in-page-ui/sidebar/react/types'
import RibbonHolder from 'src/in-page-ui/ribbon/react/containers/ribbon-holder'

const stories = storiesOf('In-page UI', module)

async function createDependencies() {
    const background = await setupBackgroundIntegrationTest()
    await background.backgroundModules.directLinking.annotationStorage.createAnnotation(
        {
            pageTitle: 'Foo title',
            pageUrl: 'foo.com',
            url: 'foo.com#4r234523453',
            body: 'Annotation body',
            comment: 'Annotation comment',
            createdWhen: new Date(),
        },
    )
    await background.backgroundModules.pages.addPage({
        bookmark: Date.now(),
        visits: [Date.now() - 1000 * 60 * 5],
        pageDoc: {
            url: 'http://foo.com',
            content: {
                title: 'Foo title',
                fullText: 'Foo page text',
            },
        },
        rejectNoContent: true,
    })

    const annotationManager = new AnnotationsManager()
    annotationManager._getAllAnnotationsByUrlRPC =
        background.backgroundModules.directLinking.getAllAnnotationsByUrl

    const highlighter = {
        removeHighlights: async () => {},
        removeTempHighlights: async () => {},
        removeAnnotationHighlights: async () => {},
    }

    const inPageUI = new InPageUI({
        loadComponent: async () => {},
    })

    const commonProps = {
        env: 'inpage' as SidebarEnv,
        currentTab: { id: 654, url: 'https://www.foo.com' },
        inPageUI,
        annotationManager,
        highlighter,
        getRemoteFunction: () => async () => {},
        annotationsManager: annotationManager,
        loadTagSuggestions: async () => [
            'first suggestion',
            'second suggestion',
        ],
        loadAnnotations: async pageUrl => {
            return background.backgroundModules.directLinking.getAllAnnotationsByUrl(
                { tab: null },
                { url: pageUrl },
            )
        },
        searchPages: async query => {
            const result = await background.backgroundModules.search.searchPages(
                {
                    query: query.length ? query : undefined,
                    contentTypes: {
                        pages: true,
                        notes: true,
                        highlights: true,
                    },
                },
            )
            return result.docs
        },
        searchAnnotations: async query => {
            const result = await background.backgroundModules.search.searchAnnotations(
                {
                    query: query.length ? query : undefined,
                },
            )

            const resultsByUrl: ResultsByUrl = new Map()
            result.docs.forEach((doc, index) => {
                resultsByUrl.set(doc.pageId, {
                    ...doc,
                    index,
                })
            })

            return {
                results: result.docs,
                resultsByUrl,
                annotsByDay: result['annotsByDay'],
            }
        },
        deleteAnnotation: async () => {},
    }

    return {
        background,
        annotationManager,
        highlighter,
        inPageUI,
        commonProps,
    }
}

stories.add('Ribbon & Sidebar', () => (
    <WithDependencies setup={createDependencies}>
        {({ commonProps, inPageUI }) => (
            <React.Fragment>
                <RibbonHolder
                    inPageUI={inPageUI}
                    containerDependencies={commonProps}
                />
                <SidebarContainer {...commonProps} />
            </React.Fragment>
        )}
    </WithDependencies>
))

stories.add('Ribbon', () => (
    <WithDependencies
        setup={async () => {
            const deps = await createDependencies()
            await deps.inPageUI.showRibbon()
            return deps
        }}
    >
        {({ commonProps, inPageUI }) => (
            <RibbonHolder
                inPageUI={inPageUI}
                containerDependencies={commonProps}
            />
        )}
    </WithDependencies>
))

stories.add('Sidebar', () => (
    <WithDependencies
        setup={async () => {
            const deps = await createDependencies()
            await deps.inPageUI.showSidebar()
            return deps
        }}
    >
        {({ commonProps }) => <SidebarContainer {...commonProps} />}
    </WithDependencies>
))
