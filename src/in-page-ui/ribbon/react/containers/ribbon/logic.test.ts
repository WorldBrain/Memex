import mapValues from 'lodash/mapValues'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import {
    RibbonContainerLogic,
    INITIAL_RIBBON_COMMENT_BOX_STATE,
    RibbonContainerOptions,
} from './logic'
import { Annotation } from 'src/annotations/types'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import { createAnnotationsCache } from 'src/annotations/annotations-cache'

function insertBackgroundFunctionTab(remoteFunctions, tab: any) {
    return mapValues(remoteFunctions, (f) => {
        return (...args: any[]) => {
            return f({ tab }, ...args)
        }
    })
}

describe('Ribbon logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    async function setupTest(
        device: UILogicTestDevice,
        options?: {
            dependencies?: Partial<RibbonContainerOptions>
        },
    ) {
        const { backgroundModules } = device
        const currentTab = {
            id: 654,
            url: 'https://www.foo.com',
            normalizedUrl: 'foo.com',
            title: 'Foo.com: Home',
        }
        const annotations = insertBackgroundFunctionTab(
            backgroundModules.directLinking.remoteFunctions,
            currentTab,
        )
        const highlighter = {
            renderHighlights: () => {},
            removeHighlights: () => {},
        } as any

        const inPageUI = new SharedInPageUIState({
            loadComponent: () => {},
            unloadComponent: () => {},
            getNormalizedPageUrl: () => currentTab.normalizedUrl,
        })

        const annotationsManager = {} as any

        let globalTooltipState = false
        let globalHighlightsState = false

        const ribbonLogic = new RibbonContainerLogic({
            setRibbonShouldAutoHide: () => undefined,
            getSidebarEnabled: async () => true,
            setSidebarEnabled: async () => {},
            inPageUI,
            currentTab,
            highlighter,
            annotationsManager,
            getRemoteFunction: () => async () => {},
            bookmarks: backgroundModules.search.remoteFunctions.bookmarks,
            tags: backgroundModules.tags.remoteFunctions,
            customLists: backgroundModules.customLists.remoteFunctions,
            activityLogger: backgroundModules.activityLogger.remoteFunctions,
            annotations,
            ...(options?.dependencies ?? {}),
            tooltip: {
                getState: async () => globalTooltipState,
                setState: async (value) => {
                    globalTooltipState = value
                },
            },
            highlights: {
                getState: async () => globalHighlightsState,
                setState: async (value) => {
                    globalHighlightsState = value
                },
            },
            annotationsCache: createAnnotationsCache(
                {
                    ...backgroundModules,
                    annotations,
                },
                { skipPageIndexing: true },
            ),
        })

        const ribbon = device.createElement(ribbonLogic)
        return { ribbon, inPageUI, ribbonLogic }
    }

    it('should load', async ({ device }) => {
        const { ribbon: firstRibbon } = await setupTest(device, {
            dependencies: {
                getSidebarEnabled: async () => true,
            },
        })
        await firstRibbon.init()
        expect(firstRibbon.state.isRibbonEnabled).toBe(true)

        const { ribbon: secondRibbon } = await setupTest(device, {
            dependencies: {
                getSidebarEnabled: async () => false,
            },
        })
        await secondRibbon.init()
        expect(secondRibbon.state.isRibbonEnabled).toBe(false)
    })

    it('should toggle the ribbon', async ({ device }) => {
        let sidebarEnabled = true
        const { ribbon, inPageUI } = await setupTest(device, {
            dependencies: {
                getSidebarEnabled: async () => sidebarEnabled,
                setSidebarEnabled: async (enabled) => {
                    sidebarEnabled = enabled
                },
            },
        })
        await inPageUI.showRibbon()
        await ribbon.init()

        const expectEnabled = (value: boolean) => {
            expect(sidebarEnabled).toBe(value)
            expect(ribbon.state.isRibbonEnabled).toBe(value)
            expect(inPageUI).toEqual(
                expect.objectContaining({
                    componentsShown: expect.objectContaining({ ribbon: value }),
                    componentsSetUp: expect.objectContaining({ ribbon: value }),
                }),
            )
        }
        expectEnabled(true)
        await ribbon.processEvent('toggleRibbon', null)
        expectEnabled(false)
    })

    it('should toggle a bookmark', async ({ device }) => {
        const { ribbon } = await setupTest(device)

        // TODO: Once we make page indexing more testable, fully test down to the DB level
        let hasBookmark = false
        device.backgroundModules.search.remoteFunctions.bookmarks.addPageBookmark = async () => {
            hasBookmark = true
        }
        device.backgroundModules.search.remoteFunctions.bookmarks.delPageBookmark = async () => {
            hasBookmark = false
        }
        await ribbon.init()

        expect(ribbon.state.bookmark.isBookmarked).toBe(false)
        await ribbon.processEvent('toggleBookmark', null)
        expect(ribbon.state.bookmark.isBookmarked).toBe(true)
    })

    it('should be able to toggle tooltip', async ({ device }) => {
        const { ribbon } = await setupTest(device)

        await ribbon.init()
        expect(ribbon.state.tooltip.isTooltipEnabled).toBe(false)
        await ribbon.processEvent('handleTooltipToggle', null)
        expect(ribbon.state.tooltip.isTooltipEnabled).toBe(true)
        await ribbon.processEvent('handleTooltipToggle', null)
        expect(ribbon.state.tooltip.isTooltipEnabled).toBe(false)
    })

    it('should be able to toggle highlights', async ({ device }) => {
        const { ribbon } = await setupTest(device)

        await ribbon.init()
        expect(ribbon.state.highlights.areHighlightsEnabled).toBe(false)
        await ribbon.processEvent('handleHighlightsToggle', null)
        expect(ribbon.state.highlights.areHighlightsEnabled).toBe(true)
        await ribbon.processEvent('handleHighlightsToggle', null)
        expect(ribbon.state.highlights.areHighlightsEnabled).toBe(false)
    })

    it('should call passed-down callback when toggling popup open state', async ({
        device,
    }) => {
        let arePopupsOpen = false
        const toggleAutoHideRibbon = () => {
            arePopupsOpen = !arePopupsOpen
        }
        const { ribbon } = await setupTest(device, {
            dependencies: { setRibbonShouldAutoHide: toggleAutoHideRibbon },
        })

        await ribbon.init()

        expect(arePopupsOpen).toBe(false)
        await ribbon.processEvent('setShowCommentBox', { value: true })
        expect(arePopupsOpen).toBe(true)
        await ribbon.processEvent('setShowCommentBox', { value: false })

        expect(arePopupsOpen).toBe(false)
        await ribbon.processEvent('setShowListsPicker', { value: true })
        expect(arePopupsOpen).toBe(true)
        await ribbon.processEvent('setShowListsPicker', { value: false })

        expect(arePopupsOpen).toBe(false)
        await ribbon.processEvent('setShowTagsPicker', { value: true })
        expect(arePopupsOpen).toBe(true)
        await ribbon.processEvent('setShowTagsPicker', { value: false })

        expect(arePopupsOpen).toBe(false)
        await ribbon.processEvent('setShowSearchBox', { value: true })
        expect(arePopupsOpen).toBe(true)
        await ribbon.processEvent('setShowSearchBox', { value: false })
        expect(arePopupsOpen).toBe(false)
    })

    it('should save a comment that is bookmarked', async ({ device }) => {
        const { ribbon, ribbonLogic } = await setupTest(device)

        await ribbon.init()
        expect(ribbon.state.commentBox).toEqual(
            INITIAL_RIBBON_COMMENT_BOX_STATE,
        )

        await ribbon.processEvent('setShowCommentBox', { value: true })
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
            showCommentBox: true,
        })

        ribbonLogic.commentSavedTimeout = 1
        await ribbon.processEvent('saveComment', {
            value: {
                isBookmarked: true,
                text: 'comment',
                tags: [],
            },
        })
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
        })
        const annotations: Annotation[] = await device.storageManager
            .collection('annotations')
            .findObjects({})
        expect(annotations).toEqual([
            expect.objectContaining({
                pageTitle: 'Foo.com: Home',
                pageUrl: 'foo.com',
            }),
        ])

        expect(
            await device.storageManager
                .collection('annotBookmarks')
                .findObjects({}),
        ).toEqual([
            expect.objectContaining({
                url: annotations[0].url,
            }),
        ])
    })

    it('should rehydrate state on URL change', async ({ device }) => {
        const pageBookmarksMockDB: { [url: string]: boolean } = {}

        device.backgroundModules.search.remoteFunctions.bookmarks = {
            pageHasBookmark: async (url) => pageBookmarksMockDB[url] ?? false,
            addPageBookmark: async (args) => {
                pageBookmarksMockDB[args.url] = true
            },
            delPageBookmark: async (args) => {
                pageBookmarksMockDB[args.url] = false
            },
        }

        const newURL = 'https://www.newurl.com'

        const { ribbon } = await setupTest(device)

        await ribbon.init()

        expect(ribbon.state.bookmark.isBookmarked).toBe(false)
        await ribbon.processEvent('toggleBookmark', null)
        expect(ribbon.state.bookmark.isBookmarked).toBe(true)

        expect(ribbon.state.pageUrl).not.toEqual(newURL)
        await ribbon.processEvent('hydrateStateFromDB', { url: newURL })
        expect(ribbon.state.bookmark.isBookmarked).toBe(false)
        expect(ribbon.state.pageUrl).toEqual(newURL)
    })
})
