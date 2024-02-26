import * as React from 'react'
import { createRef } from 'react'

import styled, { css } from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'
import SaveBtn from './save-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { NoteResultHoverState, FocusableComponent } from './types'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import type { ListDetailsGetter } from '../types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Margin from 'src/dashboard-refactor/components/Margin'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import delay from 'src/util/delay'
import { AnnotationsSidebarInPageEventEmitter } from 'src/sidebar/annotations-sidebar/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { sleepPromise } from 'src/util/promises'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'

interface State {
    isTagPickerShown: boolean
    isListPickerShown: boolean
    toggleShowTutorial: boolean
    youtubeShortcut: string | null
    onEditClick?: boolean
    isDeboucingEditor: boolean
}

export interface AnnotationCreateEventProps {
    onSave: (shouldShare: boolean, isProtected?: boolean) => Promise<void>
    onCancel: () => void
    onCommentChange: (text: string) => void
    getListDetailsById: ListDetailsGetter
    onListsHover?: React.MouseEventHandler
    annotationFooterDependencies?: AnnotationFooterEventProps
    onFooterHover?: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onUnhover?: React.MouseEventHandler
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    autoFocus?: boolean
    focusEditForm?: boolean
    comment: string
    lists: number[]
    hoverState: NoteResultHoverState
    contextLocation?: string
    isRibbonCommentBox?: boolean
    getYoutubePlayer?(): YoutubePlayer
    renderSpacePicker(): JSX.Element
    sidebarEvents?: AnnotationsSidebarInPageEventEmitter
    imageSupport: ImageSupportInterface<'caller'>
    getRootElement: () => HTMLElement
}

export interface Props
    extends AnnotationCreateGeneralProps,
        AnnotationCreateEventProps {
    loadDefaultTagSuggestions?: () => string[] | Promise<string[]>
    tagQueryEntries?: (query: string) => Promise<string[]>
}

export class AnnotationCreate extends React.Component<Props, State>
    implements FocusableComponent {
    static ALT_KEY = getKeyName({ key: 'alt' })
    static MOD_KEY = getKeyName({ key: 'mod' })
    //private textAreaRef = React.createRef<HTMLTextAreaElement>()
    // private markdownPreviewRef = React.createRef<
    //     MarkdownPreviewAnnotationInsertMenu
    // >()

    static defaultProps: Pick<Props, 'hoverState'> = {
        hoverState: null,
    }

    private markdownbuttonRef = createRef<HTMLElement>()
    private spacePickerButtonRef = createRef<HTMLDivElement>()

    private editor: MemexEditorInstance

    state: State = {
        isTagPickerShown: false,
        isListPickerShown: false,
        toggleShowTutorial: false,
        youtubeShortcut: null,
        onEditClick: false,
        isDeboucingEditor: false,
    }

    async componentDidMount() {
        // if (this.props.autoFocus) {
        //     this.focus()
        // }
        await this.setYoutubeKeyboardShortcut()

        if (this.props.sidebarEvents) {
            const youtubeSummariseEvents = this.props.sidebarEvents
            youtubeSummariseEvents.on(
                'triggerYoutubeTimestampSummary',
                ({ text, showLoadingSpinner }, callback) => {
                    if (!this.editor) {
                        callback(false) // signal that listener isn't ready
                        return
                    }

                    if (text) {
                        this.editor?.addYoutubeTimestampWithText(
                            text,
                            showLoadingSpinner,
                        )
                        callback(true) // signal successful processing
                    } else {
                        callback(false) // signal failure or "not ready" due to missing data
                    }
                },
            )
            youtubeSummariseEvents.on(
                'addVideoSnapshotToEditor',
                async ({ imageData }, callback) => {
                    if (!this.editor) {
                        callback(false) // signal that listener isn't ready
                        return
                    }

                    if (imageData) {
                        await sleepPromise(50)
                        this.editor?.addVideoSnapshotToEditor(imageData)
                        callback(true) // signal successful processing
                    } else {
                        callback(false) // signal failure or "not ready" due to missing data
                    }
                },
            )
            youtubeSummariseEvents.on(
                'addImageToEditor',
                async ({ imageData }, callback) => {
                    if (!this.editor) {
                        callback(false) // signal that listener isn't ready
                        return
                    }

                    if (imageData) {
                        await sleepPromise(50)
                        this.editor?.addImageToEditor(imageData)
                        callback(true) // signal successful processing
                    } else {
                        callback(false) // signal failure or "not ready" due to missing data
                    }
                },
            )
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.autoFocus !== this.props.autoFocus) {
            this.focus()
        }
    }

    componentWillUnmount(): void {
        if (this.props.sidebarEvents) {
            const youtubeSummariseEvents = this.props.sidebarEvents

            youtubeSummariseEvents.removeAllListeners(
                'triggerYoutubeTimestampSummary',
            )
        }
    }

    setDebouncingSaveBlock = (isDeboucingEditor: boolean) => {
        this.setState({ isDeboucingEditor })
    }

    private get displayLists(): Array<{
        id: number
        name: string | JSX.Element
        isShared: boolean
        type: 'page-link' | 'user-list' | 'special-list' | 'rss-feed'
    }> {
        return this.props.lists.map((id) => ({
            id,
            ...this.props.getListDetailsById(id),
        }))
    }

    private get hasSharedLists(): boolean {
        return this.displayLists.some((list) => list.isShared)
    }

    addYoutubeTimestampToEditor(commentText) {
        // This is a hack to patch over a race condition between the state update and the rendering of the Editor which is dependent on that state.
        //  Ideally we avoid this race condition by making the editor's state controlled (vs uncontrolled) then we can
        //  add the timestamp to the state at a higher level rather than needing to do this call chain going down deeper into the comp tree.
        if (!this.state.onEditClick) {
            this.setState({ onEditClick: true }, async () => {
                await delay(300)
                if (commentText) {
                    this.editor?.addYoutubeTimestampWithText(commentText)
                } else {
                    this.editor?.addYoutubeTimestamp()
                }
            })
        } else {
            if (commentText) {
                this.editor?.addYoutubeTimestampWithText(commentText)
            } else {
                this.editor?.addYoutubeTimestamp()
            }
        }
    }

    focus() {
        const inputLen = this.props.comment.length
        // this.textAreaRef.current.focus()
        // this.textAreaRef.current.setSelectionRange(inputLen, inputLen)
    }

    handleClickOutside() {
        if (this.props.hide && !this.props.comment.length) {
            this.props.hide()
        }
    }

    private toggleShowTutorial = () => {
        this.setState({ toggleShowTutorial: !this.state.toggleShowTutorial })
    }

    private hideTagPicker = () => this.setState({ isTagPickerShown: false })
    // private toggleMarkdownHelp = () => this.props.toggleMarkdownHelp
    private handleCancel = () => {
        this.setState({ onEditClick: false })
        this.editor?.resetState()
        this.props.onCancel()
    }
    private handleSave = async (
        shouldShare: boolean,
        isProtected?: boolean,
    ) => {
        if (this.state.isDeboucingEditor) {
            await sleepPromise(250)
        }
        const saveP = this.props.onSave(shouldShare, isProtected)
        this.setState({ toggleShowTutorial: false, onEditClick: false })

        this.editor?.resetState()

        await saveP
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            if (this.props.comment.length) {
                e.stopPropagation()
            }
            this.setState({ onEditClick: false }),
                (e.target as HTMLElement).blur()

            this.props.onCancel()
            return
        }

        // If we don't have this, events will bubble up, out of the content script into the parent page!
        e.stopPropagation()

        if (navigator.platform === 'MacIntel') {
            if (e.key === 'Enter' && e.shiftKey && e.metaKey) {
                return this.handleSave(true, false)
            }

            if (e.key === 'Enter' && e.shiftKey && e.altKey) {
                return this.handleSave(true, true)
            }

            if (e.key === 'Enter' && e.altKey) {
                return this.handleSave(false, true)
            }

            if (e.key === 'Enter' && e.metaKey) {
                return this.handleSave(false, false)
            }
        } else {
            if (e.key === 'Enter' && e.shiftKey && e.ctrlKey) {
                return this.handleSave(true, false)
            }

            if (e.key === 'Enter' && e.shiftKey && e.altKey) {
                return this.handleSave(true, true)
            }

            // if (e.key === 'Enter' && e.altKey) {
            //     return this.handleSave(false, true)
            // }

            if (e.key === 'Enter' && e.ctrlKey) {
                return this.handleSave(false, false)
            }
        }
        // if (e.key === 'Tab' && !e.shiftKey) {
        //     e.preventDefault()
        //     insertTab({ el: this.textAreaRef.current })
        // }

        // if (e.key === 'Tab' && e.shiftKey) {
        //     e.preventDefault()
        //     uninsertTab({ el: this.textAreaRef.current })
        // }
        e.stopPropagation()
    }

    private toggleSpacePicker() {
        this.setState({ isListPickerShown: !this.state.isListPickerShown })
    }

    private renderSpacePicker = () => {
        if (!this.state.isListPickerShown) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.spacePickerButtonRef.current}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={
                    this.state.isListPickerShown &&
                    (() => this.toggleSpacePicker())
                }
                getPortalRoot={this.props.getRootElement}
            >
                {this.props.renderSpacePicker()}
            </PopoutBox>
        )
    }

    private renderActionButtons() {
        // const shareIconData = getShareButtonData(
        //     isShared,
        //     isBulkShareProtected,
        //     this.hasSharedLists,
        // )

        return (
            <DefaultFooterStyled>
                <BtnContainerStyled>
                    <SaveCancelArea>
                        <TooltipBox
                            tooltipText="Cancel Edit (esc)"
                            placement="bottom"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <Icon
                                onClick={this.handleCancel}
                                icon={icons.removeX}
                                color={'white'}
                                heightAndWidth="20px"
                            />
                        </TooltipBox>
                        <SaveBtn
                            onSave={this.handleSave}
                            hasSharedLists={this.hasSharedLists}
                            shortcutText={`${AnnotationCreate.MOD_KEY} + Enter`}
                            getRootElement={this.props.getRootElement}
                        />
                    </SaveCancelArea>
                </BtnContainerStyled>
            </DefaultFooterStyled>
        )
    }

    private setYoutubeKeyboardShortcut = async () => {
        const shortcuts = await getKeyboardShortcutsState()
        const youtubeShortcut = shortcuts.createAnnotation.shortcut
        this.setState({ youtubeShortcut })
    }

    render() {
        return (
            <>
                <TextBoxContainerStyled hasLists={this.displayLists.length > 0}>
                    <EditorContainer
                        onClick={() => {
                            if (!this.state.onEditClick) {
                                this.setState({ onEditClick: true })
                            }
                            this.editor?.focus()
                        }}
                    >
                        <MemexEditor
                            onKeyDown={this.handleInputKeyDown}
                            onContentUpdate={(content) => {
                                this.props.onCommentChange(content)
                            }}
                            markdownContent={this.props.comment}
                            setEditorInstanceRef={(editor) =>
                                (this.editor = editor)
                            }
                            autoFocus={
                                this.props.autoFocus || this.state.onEditClick
                            }
                            placeholder={`Write a note...`}
                            isRibbonCommentBox={this.props.isRibbonCommentBox}
                            getYoutubePlayer={this.props.getYoutubePlayer}
                            sidebarEvents={this.props.sidebarEvents}
                            imageSupport={this.props.imageSupport}
                            getRootElement={this.props.getRootElement}
                            editable={true}
                            setEditing={(editing: boolean) =>
                                this.setState({ onEditClick: editing })
                            }
                            setDebouncingSaveBlock={this.setDebouncingSaveBlock}
                        />
                    </EditorContainer>
                    {this.props.comment.length > 0 &&
                        (this.state.onEditClick || this.props.autoFocus) && (
                            <FooterContainer>
                                <SaveActionBar>
                                    <PrimaryAction
                                        onClick={() =>
                                            this.setState({
                                                isListPickerShown: true,
                                            })
                                        }
                                        label="Spaces"
                                        innerRef={this.spacePickerButtonRef}
                                        icon="plus"
                                        iconColor="prime1"
                                        size="small"
                                        type="tertiary"
                                    />
                                    {this.renderActionButtons()}
                                </SaveActionBar>
                                {this.renderSpacePicker()}
                            </FooterContainer>
                        )}

                    {this.displayLists?.length > 0 && (
                        <ListsSegment
                            newLineOrientation={true}
                            lists={this.displayLists}
                            onMouseEnter={this.props.onListsHover}
                            onListClick={undefined}
                            onEditBtnClick={() =>
                                this.setState({
                                    isListPickerShown: true,
                                })
                            }
                            spacePickerButtonRef={this.spacePickerButtonRef}
                            renderSpacePicker={this.renderSpacePicker}
                        />
                    )}
                </TextBoxContainerStyled>
            </>
        )
    }
}

export default AnnotationCreate

const EditorContainer = styled(Margin)`
    z-index: 1000;
    border-radius: 8px;
    width: fill-available;
    width: -moz-available;
    background-color: ${(props) => props.theme.colors.greyScale2};

    &:focus-within {
        background-color: ${(props) => props.theme.colors.greyScale2};
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale2}95;
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};

        &:focus-within {
            outline: 1px solid ${(props) => props.theme.colors.greyScale4};
        }
    }

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            &:focus-within {
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
            }
            &:hover {
                background-color: ${(props) => props.theme.colors.greyScale2};
                outline: 1px solid ${(props) => props.theme.colors.greyScale2};
            }
            caret-color: ${(props) => props.theme.colors.greyScale5};
        `};
`

const EditorDummy = styled.div`
    outline: none;
    padding: 10px 10px;
    width: fill-available;
    border-radius: 6px;
    min-height: 20px;
    white-space: pre-wrap;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.greyScale2};
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    cursor: text;
    float: left;
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    align-items: center;
    font-weight: 400;
`

const SaveCancelArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    justify-content: space-between;
`

const DeleteConfirmStyled = styled.span`
    box-sizing: border-box;
    font-weight: 800;
    font-size: 14px;
    color: #000;
    margin-right: 10px;
    text-align: right;
`
const ShareBtn = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 24px;
    color: ${(props) => props.theme.colors.white};
    font-size: 12px;
    cursor: pointer;
    grid-gap: 4px;

    & * {
        cursor: pointer;
    }
`
const BtnContainerStyled = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
`

const DefaultFooterStyled = styled.div`
    display: flex;
    align-items: center;
    padding-left: 15px;
    justify-content: flex-end;
    width: fit-content;

    & > div {
        border-top: none;
    }
`

const FooterContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    z-index: 998;
    width: fill-available;
    margin-top: 5px;
    margin-bottom: 5px;
`

const SaveActionBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: fill-available;
    width: -moz-available;

    z-index: 1001;
    grid-gap: 10px;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
    align-items: center;
    cursor: pointer;
    margin-right: 15px;
    padding: 0 5px;
    border-radius: 3px;

    & * {
        cursor: pointer;
    }

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3};
    }
`

const TextBoxContainerStyled = styled.div<{
    hasLists: boolean
}>`
    box-shadow: none;
    cursor: default;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    width: calc(100% - 1px);

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }

    ${(props) =>
        props.hasLists
            ? css`
                  padding-bottom: 10px;
              `
            : undefined}
`
