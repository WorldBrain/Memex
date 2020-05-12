import mapValues from 'lodash/mapValues'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { RibbonContainerLogic, INITIAL_RIBBON_COMMENT_BOX_STATE } from './logic'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { RibbonContainerDependencies } from './types'
import { Annotation } from 'src/annotations/types'

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
            dependencies?: Partial<RibbonContainerDependencies>
        },
    ) {
        const { backgroundModules } = device
        const currentTab = {
            id: 654,
            url: 'https://www.foo.com',
            title: 'Foo.com: Home',
        }
        const inPageUI = new InPageUI({
            loadComponent: async () => {},
        })
        const highlighter = {} as any
        const annotationsManager = {} as any

        let globalTooltipState = false

        const ribbonLogic = new RibbonContainerLogic({
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
            annotations: insertBackgroundFunctionTab(
                backgroundModules.directLinking.remoteFunctions,
                currentTab,
            ),
            ...(options?.dependencies ?? {}),
            tooltip: {
                getTooltipState: async () => globalTooltipState,
                setTooltipState: async (value) => {
                    globalTooltipState = value
                },
            },
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
                    state: expect.objectContaining({ ribbon: value }),
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

        await ribbon.processEvent('handleCommentTextChange', {
            value: 'comment',
        })
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
            showCommentBox: true,
            commentText: 'comment',
        })

        await ribbon.processEvent('toggleCommentBookmark', null)
        expect(ribbon.state.commentBox).toEqual({
            ...INITIAL_RIBBON_COMMENT_BOX_STATE,
            showCommentBox: true,
            commentText: 'comment',
            isCommentBookmarked: true,
        })

        // TODO: Once we make page indexing more testable, fully test down to the DB level
        ribbonLogic.skipAnnotationPageIndexing = true
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
})
