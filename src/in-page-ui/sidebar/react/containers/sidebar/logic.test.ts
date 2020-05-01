import { SidebarContainerLogic } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
// import 'jest-extended'

const setupLogicHelper = async ({
    device,
    currentTabUrl = DATA.CURRENT_TAB_URL_1,
}: {
    device: UILogicTestDevice
    currentTabUrl?: string
}) => {
    // TODO: figure out how to set up all these deps
    const sidebarLogic = new SidebarContainerLogic({
        currentTab: { url: currentTabUrl },
        annotations: {
            createAnnotation: () => undefined,
            addAnnotationTag: () => undefined,
        },
        inPageUI: {
            state: {
                sidebar: true,
            },
        },
    } as any)

    const testLogic = device.createElement(sidebarLogic)
    await testLogic.init()
    return { testLogic, entryPickerLogic: sidebarLogic }
}

describe('SidebarContainerLogic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    describe('annotation results', () => {})

    describe('page results', () => {})

    // TODO: Figure out why we're passing in all the comment data that's already available in state
    describe('new comment box', () => {
        it('should be able to cancel writing a new comment', async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({ device })

            expect(testLogic.state.showCommentBox).toBe(false)
            await testLogic.processEvent('addNewPageComment', null)
            expect(testLogic.state.showCommentBox).toBe(true)

            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            await testLogic.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(testLogic.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            await testLogic.processEvent('cancelNewPageComment', null)
            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            expect(testLogic.state.showCommentBox).toBe(false)
        })

        it('should be able to open tag picker when writing a new comment', async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({ device })

            expect(testLogic.state.showCommentBox).toBe(false)
            await testLogic.processEvent('addNewPageComment', null)
            expect(testLogic.state.showCommentBox).toBe(true)

            expect(testLogic.state.commentBox.form.showTagsPicker).toBe(false)
            await testLogic.processEvent('toggleNewPageCommentTagPicker', null)
            expect(testLogic.state.commentBox.form.showTagsPicker).toBe(true)
        })

        it('should be able to save a new comment', async ({ device }) => {
            const { testLogic } = await setupLogicHelper({ device })

            expect(testLogic.state.showCommentBox).toBe(false)
            await testLogic.processEvent('addNewPageComment', null)
            expect(testLogic.state.showCommentBox).toBe(true)

            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            await testLogic.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(testLogic.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            await testLogic.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [],
                bookmarked: false,
                anchor: {} as any,
            })
            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            expect(testLogic.state.showCommentBox).toBe(false)
        })

        it('should be able to save a new comment with a bookmark', async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({ device })

            expect(testLogic.state.showCommentBox).toBe(false)
            await testLogic.processEvent('addNewPageComment', null)
            expect(testLogic.state.showCommentBox).toBe(true)

            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            await testLogic.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(testLogic.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            expect(testLogic.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            await testLogic.processEvent('toggleNewPageCommentBookmark', null)
            expect(testLogic.state.commentBox.form.isCommentBookmarked).toBe(
                true,
            )

            await testLogic.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [],
                bookmarked: false,
                anchor: {} as any,
            })
            expect(testLogic.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            expect(testLogic.state.showCommentBox).toBe(false)
        })

        it('should be able to save a new comment with tags', async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({ device })

            expect(testLogic.state.showCommentBox).toBe(false)
            await testLogic.processEvent('addNewPageComment', null)
            expect(testLogic.state.showCommentBox).toBe(true)

            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            await testLogic.processEvent('changePageCommentText', {
                comment: DATA.COMMENT_1,
            })
            expect(testLogic.state.commentBox.form.commentText).toEqual(
                DATA.COMMENT_1,
            )

            expect(testLogic.state.commentBox.form.tags).toEqual([])
            await testLogic.processEvent('addNewPageCommentTag', {
                tag: DATA.TAG_1,
            })
            expect(testLogic.state.commentBox.form.tags).toEqual([DATA.TAG_1])
            await testLogic.processEvent('addNewPageCommentTag', {
                tag: DATA.TAG_2,
            })
            expect(testLogic.state.commentBox.form.tags).toEqual([
                DATA.TAG_1,
                DATA.TAG_2,
            ])
            await testLogic.processEvent('deleteNewPageCommentTag', {
                tag: DATA.TAG_2,
            })
            expect(testLogic.state.commentBox.form.tags).toEqual([DATA.TAG_1])

            await testLogic.processEvent('saveNewPageComment', {
                commentText: DATA.COMMENT_1,
                tags: [],
                bookmarked: false,
                anchor: {} as any,
            })
            expect(testLogic.state.commentBox.form.tags).toEqual([])
            expect(testLogic.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            expect(testLogic.state.showCommentBox).toBe(false)
        })
    })

    describe('search-type switch', () => {})
})
