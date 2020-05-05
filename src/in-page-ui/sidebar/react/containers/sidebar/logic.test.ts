import { SidebarContainerLogic } from './logic'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import * as DATA from './logic.test.data'
import { Annotation } from 'src/annotations/types'
// import 'jest-extended'

const setupLogicHelper = async ({
    device,
    currentTabUrl = DATA.CURRENT_TAB_URL_1,
    getAllAnnotationsByUrl = async () => [],
}: {
    device: UILogicTestDevice
    currentTabUrl?: string
    getAllAnnotationsByUrl?: () => Promise<Annotation[]>
}) => {
    // TODO: figure out how to set up all these deps
    const sidebarLogic = new SidebarContainerLogic({
        currentTab: { url: currentTabUrl },
        annotations: {
            editAnnotation: () => undefined,
            createAnnotation: () => undefined,
            addAnnotationTag: () => undefined,
            deleteAnnotation: () => undefined,
            toggleAnnotBookmark: () => undefined,
            updateAnnotationTags: () => undefined,
            getAllAnnotationsByUrl,
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

    describe('annotation results', () => {
        it("should be able to edit an annotation's comment", async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({
                device,
                getAllAnnotationsByUrl: async () => [DATA.ANNOT_1],
            })
            const context = 'pageAnnotations'
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            expect(testLogic.state.annotations.length).toBe(1)
            const annotation = testLogic.state.annotations[0]
            expect(annotation.comment).toEqual(DATA.ANNOT_1.comment)

            await testLogic.processEvent('switchAnnotationMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                mode: 'edit',
            })
            expect(
                testLogic.state.annotationModes[context][DATA.ANNOT_1.url],
            ).toEqual('edit')

            await testLogic.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
                tags: [],
            })
            expect(
                testLogic.state.annotationModes[context][annotation.url],
            ).toEqual('default')
            expect(testLogic.state.annotations[0].comment).toEqual(
                editedComment,
            )
            expect(testLogic.state.annotations[0].tags).toEqual([])
            expect(testLogic.state.annotations[0].lastEdited).not.toEqual(
                annotation.lastEdited,
            )
        })

        it("should be able to edit an annotation's comment and tags", async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({
                device,
                getAllAnnotationsByUrl: async () => [DATA.ANNOT_1],
            })
            const context = 'pageAnnotations'
            const editedComment = DATA.ANNOT_1.comment + ' new stuff'

            expect(testLogic.state.annotations.length).toBe(1)
            const annotation = testLogic.state.annotations[0]
            expect(annotation.comment).toEqual(DATA.ANNOT_1.comment)

            await testLogic.processEvent('switchAnnotationMode', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                mode: 'edit',
            })
            expect(
                testLogic.state.annotationModes[context][DATA.ANNOT_1.url],
            ).toEqual('edit')

            await testLogic.processEvent('editAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
                comment: editedComment,
                tags: [DATA.TAG_1, DATA.TAG_2],
            })
            expect(
                testLogic.state.annotationModes[context][annotation.url],
            ).toEqual('default')
            expect(testLogic.state.annotations[0].comment).toEqual(
                editedComment,
            )
            expect(testLogic.state.annotations[0].tags).toEqual([
                DATA.TAG_1,
                DATA.TAG_2,
            ])
            expect(testLogic.state.annotations[0].lastEdited).not.toEqual(
                annotation.lastEdited,
            )
        })

        it('should be able to delete an annotation', async ({ device }) => {
            const { testLogic } = await setupLogicHelper({
                device,
                getAllAnnotationsByUrl: async () => [DATA.ANNOT_1],
            })
            const context = 'pageAnnotations'

            expect(testLogic.state.annotations.length).toBe(1)
            await testLogic.processEvent('deleteAnnotation', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(testLogic.state.annotations.length).toBe(0)
        })

        it("should be able to toggle an annotation's bookmark status", async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({
                device,
                getAllAnnotationsByUrl: async () => [DATA.ANNOT_1],
            })
            const context = 'pageAnnotations'

            expect(testLogic.state.annotations.length).toBe(1)
            expect(testLogic.state.annotations[0].hasBookmark).toBe(undefined)
            await testLogic.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(testLogic.state.annotations[0].hasBookmark).toBe(true)
            await testLogic.processEvent('toggleAnnotationBookmark', {
                context,
                annotationUrl: DATA.ANNOT_1.url,
            })
            expect(testLogic.state.annotations[0].hasBookmark).toBe(false)
        })

        it('should be able to go to an annotation highlight on the page', async () => {})
    })

    describe('page results', () => {
        it('should be able to delete a page via modal', async () => {})

        it("should be able to toggle a page's bookmark status", async () => {})

        it("should be able to toggle a page's tag picker", async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({
                device,
            })

            testLogic.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            shouldDisplayTagPopup: false,
                        } as any,
                    },
                },
            })

            await testLogic.processEvent('togglePageTagPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                testLogic.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayTagPopup,
            ).toBe(true)
            await testLogic.processEvent('togglePageTagPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                testLogic.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayTagPopup,
            ).toBe(false)
        })

        it("should be able to toggle a page's collection picker", async ({
            device,
        }) => {
            const { testLogic } = await setupLogicHelper({
                device,
            })

            testLogic.processMutation({
                resultsByUrl: {
                    [DATA.PAGE_URL_1]: {
                        $set: {
                            url: DATA.PAGE_URL_1,
                            shouldDisplayTagPopup: false,
                        } as any,
                    },
                },
            })

            await testLogic.processEvent('togglePageListPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                testLogic.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayListPopup,
            ).toBe(true)
            await testLogic.processEvent('togglePageListPicker', {
                pageUrl: DATA.PAGE_URL_1,
            })
            expect(
                testLogic.state.resultsByUrl[DATA.PAGE_URL_1]
                    .shouldDisplayListPopup,
            ).toBe(false)
        })

        it("should be able to toggle a page's annotations view", async () => {})

        it("should be able to toggle open a page's annotations list", async () => {})
    })

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
            expect(testLogic.state.annotations.length).toBe(1)
            expect(testLogic.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [],
                }),
            ])
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
                bookmarked: true,
                anchor: {} as any,
            })
            expect(testLogic.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [],
                }),
            ])
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
                tags: [DATA.TAG_1],
                bookmarked: false,
                anchor: {} as any,
            })
            expect(testLogic.state.annotations).toEqual([
                expect.objectContaining({
                    comment: DATA.COMMENT_1,
                    tags: [DATA.TAG_1],
                }),
            ])
            expect(testLogic.state.commentBox.form.tags).toEqual([])
            expect(testLogic.state.commentBox.form.isCommentBookmarked).toBe(
                false,
            )
            expect(testLogic.state.commentBox.form.commentText).toEqual('')
            expect(testLogic.state.showCommentBox).toBe(false)
        })
    })

    describe('search-type switch', () => {
        it('should be able to set search type', async () => {})

        it('should be able to set results search type', async () => {})
    })
})
