import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import { ButtonTooltip } from 'src/common-ui/components'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'
import TagHolder from 'src/tags/ui/tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { ClickAway } from 'src/util/click-away-wrapper'
import TagPicker, { TagPickerDependencies } from 'src/tags/ui/TagPicker'
import SaveBtn from './save-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import TagsSegment from 'src/common-ui/components/result-item-tags-segment'
import type { NoteResultHoverState, FocusableComponent } from './types'
import type { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

interface State {
    isTagPickerShown: boolean
    toggleShowTutorial: boolean
}

export interface AnnotationCreateEventProps {
    onSave: (shouldShare: boolean, isProtected?: boolean) => Promise<void>
    onCancel: () => void
    onTagsUpdate: (tags: string[]) => void
    onCommentChange: (text: string) => void
    onTagsHover?: React.MouseEventHandler
    annotationFooterDependencies?: AnnotationFooterEventProps
    onFooterHover?: React.MouseEventHandler
    onNoteHover?: React.MouseEventHandler
    onUnhover?: React.MouseEventHandler
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    autoFocus?: boolean
    comment: string
    tags: string[]
    onTagClick?: (tag: string) => void
    hoverState: NoteResultHoverState
    contextLocation?: string
    isRibbonCommentBox?: boolean
}

export interface Props
    extends AnnotationCreateGeneralProps,
        AnnotationCreateEventProps,
        Partial<
            Pick<
                TagPickerDependencies,
                'queryEntries' | 'loadDefaultSuggestions'
            >
        > {}

export class AnnotationCreate extends React.Component<Props, State>
    implements FocusableComponent {
    static ALT_KEY = getKeyName({ key: 'alt' })
    static MOD_KEY = getKeyName({ key: 'mod' })
    //private textAreaRef = React.createRef<HTMLTextAreaElement>()
    // private markdownPreviewRef = React.createRef<
    //     MarkdownPreviewAnnotationInsertMenu
    // >()

    private annotCreateRef = React.createRef<AnnotationCreate>()

    static defaultProps: Pick<Props, 'hoverState' | 'tags'> = {
        tags: [],
        hoverState: null,
    }

    private editor: MemexEditorInstance

    state: State = {
        isTagPickerShown: false,
        toggleShowTutorial: false,
    }

    componentDidMount() {
        if (this.props.autoFocus) {
            this.focus()
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

        // if (e.key === 'Tab' && !e.shiftKey) {
        //     e.preventDefault()
        //     insertTab({ el: this.textAreaRef.current })
        // }

        // if (e.key === 'Tab' && e.shiftKey) {
        //     e.preventDefault()
        //     uninsertTab({ el: this.textAreaRef.current })
        // }
    }

    private renderTagPicker() {
        const { tags, onTagsUpdate } = this.props
        const setPickerShown = (isTagPickerShown: boolean) =>
            this.setState({ isTagPickerShown })

        const tagPicker = !this.state.isTagPickerShown ? null : (
            <HoverBox left="10px">
                <ClickAway onClickAway={() => setPickerShown(false)}>
                    <TagPicker
                        {...this.props}
                        onUpdateEntrySelection={async ({ selected }) =>
                            onTagsUpdate(selected)
                        }
                        initialSelectedEntries={() => tags}
                        onEscapeKeyDown={() => setPickerShown(false)}
                    />
                </ClickAway>
            </HoverBox>
        )

        return <div>{tagPicker}</div>
    }

    private renderMarkdownHelpButton() {
        return (
            <MarkdownButtonContainer>
                <ButtonTooltip
                    tooltipText="Show formatting help"
                    position="bottom"
                >
                    <MarkdownButton
                        src={icons.helpIcon}
                        onClick={() => this.toggleShowTutorial()}
                    />
                </ButtonTooltip>
            </MarkdownButtonContainer>
        )
    }

    private renderActionButtons() {
        return (
            <FooterStyled>
                <Flex>
                    <SaveBtn onSave={this.handleSave} />
                    <ButtonTooltip tooltipText="esc" position="bottom">
                        <CancelBtnStyled onClick={this.handleCancel}>
                            Cancel
                        </CancelBtnStyled>
                    </ButtonTooltip>
                </Flex>
            </FooterStyled>
        )
    }

    render() {
        const setPickerShown = (isTagPickerShown: boolean) =>
            this.setState({ isTagPickerShown })

        return (
            <>
                <TextBoxContainerStyled>
                    <MemexEditor
                        onKeyDown={this.handleInputKeyDown}
                        onContentUpdate={(content) =>
                            this.props.onCommentChange(content)
                        }
                        markdownContent={this.props.comment}
                        setEditorInstanceRef={(editor) =>
                            (this.editor = editor)
                        }
                        autoFocus={this.props.autoFocus}
                        placeholder={`Add private note.\n Save with ${AnnotationCreate.MOD_KEY}+enter (+shift to share)`}
                        isRibbonCommentBox={this.props.isRibbonCommentBox}
                    />
                    {this.props.comment !== '' && (
                        <>
                            <TagsSegment
                                tags={this.props.tags}
                                onMouseEnter={this.props.onTagsHover}
                                showEditBtn={this.props.hoverState === 'tags'}
                                onTagClick={this.props.onTagClick}
                                onEditBtnClick={() =>
                                    setPickerShown(!this.state.isTagPickerShown)
                                }
                            />
                            {this.renderTagPicker()}
                            <FooterContainer>
                                <SaveActionBar>
                                    {this.renderActionButtons()}
                                    {this.renderMarkdownHelpButton()}
                                </SaveActionBar>
                            </FooterContainer>
                        </>
                    )}
                </TextBoxContainerStyled>
                {this.state.toggleShowTutorial && (
                    <ClickAway
                        onClickAway={() =>
                            this.setState({ toggleShowTutorial: false })
                        }
                    >
                        <HoverBox
                            top={
                                this.props.contextLocation === 'dashboard'
                                    ? 'unset'
                                    : '215px'
                            }
                            bottom={
                                this.props.contextLocation === 'dashboard'
                                    ? '60px'
                                    : 'unset'
                            }
                            right={
                                this.props.contextLocation === 'dashboard'
                                    ? '20px'
                                    : '50px'
                            }
                            width="430px"
                            position={
                                this.props.contextLocation === 'dashboard'
                                    ? 'fixed'
                                    : 'initial'
                            }
                            height="430px"
                            overflow="scroll"
                        >
                            <QuickTutorial
                                markdownHelpOnTop={true}
                                getKeyboardShortcutsState={
                                    getKeyboardShortcutsState
                                }
                            />
                        </HoverBox>
                    </ClickAway>
                )}
            </>
        )
    }
}

export default onClickOutside(AnnotationCreate)

const FooterContainer = styled.div`
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 15px 5px 15px;
`

const SaveActionBar = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
`

const MarkdownButton = styled.img`
    display: flex;
    height: 16px;
    opacity: 0.8;
    mask-position: center center;
    margin-left: 10px;
    cursor: pointer;
`

const TextBoxContainerStyled = styled.div`
    box-shadow: none;
    cursor: default;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    width: 100%;
    border-radius: 12px;
    background-color: ${(props) => (props.comment !== '' ? 'white' : 'none')};

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const StyledTextArea = styled.textarea`
    background-color: white;
    box-sizing: border-box;
    resize: vertical;
    font-weight: 400;
    font-size: 14px;
    color: #222;
    font-family: ${(props) => props.theme.fonts.primary};
    border-radius: 3px;
    border: none;
    padding: 10px 7px;
    height: ${(props) => (props.value === '' ? '40px' : '150px')};
    width: auto;
    min-height: 70px;

    &::placeholder {
        color: ${(props) => props.theme.colors.primary};
        opacity: 0.5;
    }

    &:focus {
        outline: none;
        box-shadow: none;
        border: none;
    }

    &:focus {
        outline: none;
    }
`

const FooterStyled = styled.div`
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    align-items: center;
    animation: slideIn 0.2s ease-in-out;
    animation-fill-mode: forwards;
`

const CancelBtnStyled = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    background: transparent;
    border-radius: 3px;
    color: red;

    &:hover {
        background-color: ${(props) => props.theme.colors.backgroundColor};

    &:focus {
        background-color: #79797945;
    }
`

const Flex = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
`
