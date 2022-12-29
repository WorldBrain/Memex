import * as React from 'react'
import { createRef } from 'react'

import styled from 'styled-components'

import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'
import SaveBtn from './save-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import type { NoteResultHoverState, FocusableComponent } from './types'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import CollectionPicker from 'src/custom-lists/ui/CollectionPicker'
import type { SpacePickerDependencies } from 'src/custom-lists/ui/CollectionPicker/logic'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import ListsSegment from 'src/common-ui/components/result-item-spaces-segment'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { ListDetailsGetter } from '../types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Margin from 'src/dashboard-refactor/components/Margin'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { YoutubePlayer } from '@worldbrain/memex-common/lib/services/youtube/types'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

interface State {
    isTagPickerShown: boolean
    isListPickerShown: boolean
    toggleShowTutorial: boolean
    youtubeShortcut: string | null
    onEditClick?: boolean
}

export interface AnnotationCreateEventProps {
    onSave: (shouldShare: boolean, isProtected?: boolean) => Promise<void>
    onCancel: () => void
    onTagsUpdate?: (tags: string[]) => void
    onCommentChange: (text: string) => void
    getListDetailsById: ListDetailsGetter
    onTagsHover?: React.MouseEventHandler
    onListsHover?: React.MouseEventHandler
    annotationFooterDependencies?: AnnotationFooterEventProps
    onFooterHover?: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onUnhover?: React.MouseEventHandler
    createNewList?: SpacePickerDependencies['createNewEntry']
    addPageToList?: SpacePickerDependencies['selectEntry']
    removePageFromList?: SpacePickerDependencies['unselectEntry']
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    autoFocus?: boolean
    comment: string
    tags?: string[]
    lists: number[]
    onTagClick?: (tag: string) => void
    hoverState: NoteResultHoverState
    contextLocation?: string
    isRibbonCommentBox?: boolean
    spacesBG?: RemoteCollectionsInterface
    contentSharingBG?: ContentSharingInterface
    getYoutubePlayer?(): YoutubePlayer
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

    static defaultProps: Pick<Props, 'hoverState' | 'tags'> = {
        tags: [],
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
    }

    async componentDidMount() {
        if (this.props.autoFocus) {
            this.focus()
        }
        await this.setYoutubeKeyboardShortcut()
    }

    private get displayLists(): Array<{
        id: number
        name: string
        isShared: boolean
    }> {
        return this.props.lists.map((id) => ({
            id,
            ...this.props.getListDetailsById(id),
        }))
    }

    private get hasSharedLists(): boolean {
        return this.displayLists.some((list) => list.isShared)
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
    private handleCancel = () => this.props.onCancel()
    private handleSave = async (
        shouldShare: boolean,
        isProtected?: boolean,
    ) => {
        const saveP = this.props.onSave(shouldShare, isProtected)
        this.setState({ toggleShowTutorial: false })

        this.editor?.resetState()

        await saveP
    }

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar only if no input state
        if (e.key === 'Escape') {
            if (this.props.comment.length) {
                e.stopPropagation()
            }
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

            if (e.key === 'Enter' && e.altKey) {
                return this.handleSave(false, true)
            }

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
    }

    private toggleSpacePicker() {
        this.setState({ isListPickerShown: !this.state.isListPickerShown })
    }

    private renderSpacePicker = () => {
        const { lists } = this.props

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
            >
                <CollectionPicker
                    initialSelectedListIds={() => lists}
                    unselectEntry={this.props.removePageFromList}
                    createNewEntry={this.props.createNewList}
                    selectEntry={this.props.addPageToList}
                    contentSharingBG={this.props.contentSharingBG}
                    spacesBG={this.props.spacesBG}
                />
            </PopoutBox>
        )
    }

    private renderMarkdownHelpButton() {
        if (!this.state.toggleShowTutorial) {
            return
        }

        return (
            <PopoutBox
                targetElementRef={this.markdownbuttonRef.current}
                placement={'bottom-start'}
                offsetX={10}
                closeComponent={() => this.toggleShowTutorial()}
                width={'440px'}
            >
                <QuickTutorial
                    markdownHelpOnTop={true}
                    getKeyboardShortcutsState={getKeyboardShortcutsState}
                />
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
                    <MarkdownButtonContainer
                        onClick={() => this.toggleShowTutorial()}
                        ref={this.markdownbuttonRef}
                    >
                        Formatting
                        <Icon
                            filePath={icons.helpIcon}
                            heightAndWidth={'20px'}
                            hoverOff
                        />
                    </MarkdownButtonContainer>
                    <SaveCancelArea>
                        <TooltipBox
                            tooltipText="Cancel Edit (esc)"
                            placement="bottom"
                        >
                            <Icon
                                onClick={this.handleCancel}
                                icon={icons.removeX}
                                color={'normalText'}
                                heightAndWidth="20px"
                            />
                        </TooltipBox>
                        <SaveBtn
                            onSave={this.handleSave}
                            hasSharedLists={this.hasSharedLists}
                            shortcutText={`${AnnotationCreate.MOD_KEY} + Enter`}
                        />
                    </SaveCancelArea>
                </BtnContainerStyled>
                {this.renderMarkdownHelpButton()}
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
                <TextBoxContainerStyled>
                    <EditorContainer vertical="10px">
                        {this.state.onEditClick ? (
                            <MemexEditor
                                onKeyDown={this.handleInputKeyDown}
                                onContentUpdate={(content) =>
                                    this.props.onCommentChange(content)
                                }
                                markdownContent={this.props.comment}
                                setEditorInstanceRef={(editor) =>
                                    (this.editor = editor)
                                }
                                autoFocus={
                                    this.props.autoFocus ||
                                    this.state.onEditClick
                                }
                                placeholder={`Add a private note. Save with ${AnnotationCreate.MOD_KEY} + Enter, + Shift to share.`}
                                isRibbonCommentBox={
                                    this.props.isRibbonCommentBox
                                }
                                youtubeShortcut={this.state.youtubeShortcut}
                                getYoutubePlayer={this.props.getYoutubePlayer}
                            />
                        ) : (
                            <EditorDummy
                                onClick={() =>
                                    this.setState({
                                        onEditClick: true,
                                    })
                                }
                            >
                                Add private note. Save with{' '}
                                <KeyboardShortcuts
                                    keys={[AnnotationCreate.MOD_KEY, 'Enter']}
                                    size="small"
                                />
                                +{' '}
                                <KeyboardShortcuts
                                    optional="Shift"
                                    size="small"
                                />{' '}
                                to share.
                            </EditorDummy>
                        )}
                    </EditorContainer>
                    {this.props.comment === '' ? null : (
                        <FooterContainer>
                            <ListsSegment
                                newLineOrientation={true}
                                lists={this.displayLists}
                                onMouseEnter={this.props.onListsHover}
                                onListClick={undefined}
                                onEditBtnClick={() =>
                                    this.setState({ isListPickerShown: true })
                                }
                                spacePickerButtonRef={this.spacePickerButtonRef}
                                renderSpacePicker={this.renderSpacePicker}
                            />
                            {this.renderSpacePicker()}
                            <SaveActionBar>
                                {this.renderActionButtons()}
                            </SaveActionBar>
                        </FooterContainer>
                    )}
                </TextBoxContainerStyled>
            </>
        )
    }
}

export default AnnotationCreate

const EditorContainer = styled(Margin)`
    z-index: 1000;
    border-radius: 5px;

    &:focus-within {
        background-color: ${(props) => props.theme.colors.darkhover};
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
    &:hover {
        background-color: ${(props) => props.theme.colors.darkhover};
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    }
`

const EditorDummy = styled.div`
    outline: none;
    padding: 10px 10px;
    width: fill-available;
    border-radius: 3px;
    min-height: 20px;
    white-space: pre-wrap;
    overflow: hidden;
    background-color: ${(props) => props.theme.colors.darkhover};
    font-family: 'Satoshi', sans-serif;
    cursor: text;
    float: left;
    color: ${(props) => props.theme.colors.greyScale8};
    display: flex;
    align-items: center;
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
    color: ${(props) => props.theme.colors.normalText};
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
`

const SaveActionBar = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;

    z-index: 1001;
    grid-gap: 10px;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    align-items: center;
    cursor: pointer;
    margin-right: 15px;
    padding: 0 5px;
    border-radius: 3px;

    & * {
        cursor: pointer;
    }

    &:hover {
        background-color: ${(props) => props.theme.colors.lightHover};
    }
`

const TextBoxContainerStyled = styled.div`
    box-shadow: none;
    cursor: default;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    width: 100%;
    border-radius: 8px;
    margin-bottom: 10px;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`
