import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
    insertBackgroundFunctionTab,
} from 'src/tests/ui-logic-tests'
import {
    RibbonContainerLogic,
    INITIAL_RIBBON_COMMENT_BOX_STATE,
    RibbonLogicOptions,
} from './logic'
import { Annotation } from 'src/annotations/types'
import { SharedInPageUIState } from 'src/in-page-ui/shared-state/shared-in-page-ui-state'
import { createAnnotationsCache } from 'src/annotations/annotations-cache'
import { FakeAnalytics } from 'src/analytics/mock'

describe('Ribbon logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    async function setupTest(
        device: UILogicTestDevice,
        options: {
            dependencies?: Partial<RibbonLogicOptions>
        } = {},
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
        ) as any
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
        const analytics = new FakeAnalytics()

        const ribbonLogic = new RibbonContainerLogic({
            getPageUrl: () => currentTab.normalizedUrl,
            analytics,
            setRibbonShouldAutoHide: () => undefined,
            getSidebarEnabled: async () => true,
            setSidebarEnabled: async () => {},
            focusCreateForm:
                options.dependencies?.focusCreateForm ?? (() => undefined),
            inPageUI,
            currentTab,
            highlighter,
            annotationsManager,
            getRemoteFunction: () => async () => {},
            bookmarks: backgroundModules.bookmarks.remoteFunctions,
            tags: backgroundModules.tags.remoteFunctions,
            customLists: backgroundModules.customLists.remoteFunctions,
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
                    contentSharing:
                        backgroundModules.contentSharing.remoteFunctions,
                    annotations,
                },
                { skipPageIndexing: true },
            ),
        })

        const ribbon = device.createElement(ribbonLogic)
        return { ribbon, inPageUI, ribbonLogic, analytics }
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
        device.backgroundModules.bookmarks.remoteFunctions.addPageBookmark = async () => {
            hasBookmark = true
        }
        device.backgroundModules.bookmarks.remoteFunctions.delPageBookmark = async () => {
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

    it('should save a comment', async ({ device }) => {
        const { ribbon, ribbonLogic } = await setupTest(device)
        const COMMENT_TEXT = 'comment'

        await ribbon.init()
        expect(ribbon.state.commentBox).toEqual(
            INITIAL_RIBBON_COMMENT_BOX_STATE,
        )

        await ribbon.processEvent('setShowCommentBox', { value: true })
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
            showCommentBox: true,
        })
        await ribbon.processEvent('changeComment', { value: COMMENT_TEXT })
        expect(ribbon.state.commentBox.commentText).toEqual(COMMENT_TEXT)

        ribbonLogic.commentSavedTimeout = 1
        await ribbon.processEvent('saveComment', null)

        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
        })

        expect(
            await device.storageManager
                .collection('annotations')
                .findObjects({}),
        ).toEqual([
            expect.objectContaining({
                comment: COMMENT_TEXT,
                pageTitle: 'Foo.com: Home',
                pageUrl: 'foo.com',
            }),
        ])

        expect(
            await device.storageManager.collection('tags').findObjects({}),
        ).toEqual([])
    })

    it('should save a comment with tags', async ({ device }) => {
        const { ribbon, ribbonLogic } = await setupTest(device)
        const COMMENT_TEXT = 'comment'
        const TAGS = ['a', 'b', 'c']

        await ribbon.init()
        expect(ribbon.state.commentBox).toEqual(
            INITIAL_RIBBON_COMMENT_BOX_STATE,
        )

        await ribbon.processEvent('setShowCommentBox', { value: true })
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
            showCommentBox: true,
        })
        await ribbon.processEvent('changeComment', { value: COMMENT_TEXT })
        expect(ribbon.state.commentBox.commentText).toEqual(COMMENT_TEXT)
        await ribbon.processEvent('updateCommentBoxTags', { value: TAGS })
        expect(ribbon.state.commentBox.tags).toEqual(TAGS)

        ribbonLogic.commentSavedTimeout = 1
        await ribbon.processEvent('saveComment', null)

        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
        })

        const annotations: Annotation[] = await device.storageManager
            .collection('annotations')
            .findObjects({})

        expect(annotations).toEqual([
            expect.objectContaining({
                comment: COMMENT_TEXT,
                pageTitle: 'Foo.com: Home',
                pageUrl: 'foo.com',
            }),
        ])

        expect(
            await device.storageManager.collection('tags').findObjects({}),
        ).toEqual(
            expect.arrayContaining([
                { url: annotations[0].url, name: TAGS[0] },
                { url: annotations[0].url, name: TAGS[1] },
                { url: annotations[0].url, name: TAGS[2] },
            ]),
        )
    })

    it('should be able to set focus on comment box', async ({ device }) => {
        let isCreateFormFocused = false

        const { ribbon } = await setupTest(device, {
            dependencies: {
                focusCreateForm: () => {
                    isCreateFormFocused = true
                },
            },
        })

        await ribbon.init()

        expect(isCreateFormFocused).toBe(false)
        await ribbon.processEvent('setShowCommentBox', { value: false })
        expect(isCreateFormFocused).toBe(false)
        await ribbon.processEvent('setShowCommentBox', { value: true })
        expect(isCreateFormFocused).toBe(true)
    })

    it('should fire event on adding add new tags', async ({ device }) => {
        let addedTag: string
        const { ribbon, analytics } = await setupTest(device, {
            dependencies: {
                tags: {
                    updateTagForPage: ({ added }) => {
                        addedTag = added
                    },
                } as any,
            },
        })

        await ribbon.init()

        expect(addedTag).toEqual(undefined)
        expect(analytics.popNew()).toEqual([])

        await ribbon.processEvent('updateTags', {
            value: { added: 'test', deleted: null, selected: [] },
        })

        expect(addedTag).toEqual('test')
        expect(analytics.popNew()).toEqual([
            {
                eventArgs: {
                    category: 'Tags',
                    action: 'createForPageViaRibbon',
                },
            },
        ])
    })

    it('should rehydrate state on URL change', async ({ device }) => {
        const pageBookmarksMockDB: { [url: string]: boolean } = {}

        device.backgroundModules.bookmarks.remoteFunctions = {
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
