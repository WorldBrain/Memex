import { ContentScriptRegistry, SidebarScriptMain } from './types'
import { SidebarController } from 'src/in-page-ui/sidebar'
import { browser } from 'webextension-polyfill-ts'
import { createInPageUI } from 'src/in-page-ui/utils'
import { setupSidebarUI, destroySidebarUI } from 'src/in-page-ui/sidebar/react'
import { ResultsByUrl } from 'src/overview/types'

export const main: SidebarScriptMain = async dependencies => {
    const cssFile = browser.extension.getURL(`/content_script_sidebar.css`)

    dependencies.inPageUI.events.on('componentShouldSetUp', ({ component }) => {
        if (component === 'sidebar') {
            setUp()
        }
    })
    dependencies.inPageUI.events.on(
        'componentShouldDestroy',
        ({ component }) => {
            if (component === 'sidebar') {
                destroy()
            }
        },
    )

    let mount: ReturnType<typeof createInPageUI> | null = null
    const setUp = () => {
        mount = createInPageUI('sidebar', cssFile)
        setupSidebarUI(
            mount.rootElement,
            {
                inPageUI: dependencies.inPageUI,
                loadAnnotations: async pageUrl => {
                    const annotations = await dependencies.getRemoteFunction(
                        'getAllAnnotationsByUrl',
                    )({ url: pageUrl })
                    return annotations
                },
                loadTagSuggestions: async () => [
                    'first suggestion',
                    'second suggestion',
                ],
                annotationsManager: dependencies.annotationsManager,
                currentTab: dependencies.currentTab,
                highlighter: dependencies.highlighter,
                searchAnnotations: async query => {
                    const result = await dependencies.getRemoteFunction(
                        'searchAnnotations',
                    )({
                        query: query.length ? query : undefined,
                    })

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
                searchPages: async query => {
                    const result = await dependencies.getRemoteFunction(
                        'searchPages',
                    )({
                        query: query.length ? query : undefined,
                        contentTypes: {
                            pages: true,
                            notes: true,
                            highlights: true,
                        },
                    })
                    return result.docs
                },
                deleteAnnotation: null,
            },
            {
                env: 'inpage',
            },
        )
    }

    const destroy = () => {
        if (!mount) {
            return
        }

        destroySidebarUI(mount.rootElement, mount.shadowRoot)
    }
}

const registry = window['contentScriptRegistry'] as ContentScriptRegistry
registry.registerSidebarScript(main)
