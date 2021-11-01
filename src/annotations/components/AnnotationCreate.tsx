import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import { ButtonTooltip } from 'src/common-ui/components'
import { MarkdownPreviewAnnotationInsertMenu } from 'src/markdown-preview/markdown-preview-insert-menu'
import { FocusableComponent } from './types'
import { insertTab, uninsertTab } from 'src/common-ui/utils'
import { getKeyName } from 'src/util/os-specific-key-names'
import TagHolder from 'src/tags/ui/tag-holder'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import { ClickAway } from 'src/util/click-away-wrapper'
import TagPicker, { TagPickerDependencies } from 'src/tags/ui/TagPicker'
import SaveBtn from './save-btn'

interface State {
    isTagPickerShown: boolean
}

export interface AnnotationCreateEventProps {
    onSave: (shouldShare: boolean, isProtected?: boolean) => Promise<void>
    onCancel: () => void
    onTagsUpdate: (tags: string[]) => void
    onCommentChange: (text: string) => void
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    autoFocus?: boolean
    comment: string
    tags: string[]
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
    private textAreaRef = React.createRef<HTMLTextAreaElement>()
    private markdownPreviewRef = React.createRef<
        MarkdownPreviewAnnotationInsertMenu
    >()

    state: State = {
        isTagPickerShown: false,
    }

    componentDidMount() {
        if (this.props.autoFocus) {
            this.focus()
        }
    }

    focus() {
        const inputLen = this.props.comment.length
        this.textAreaRef.current.focus()
        this.textAreaRef.current.setSelectionRange(inputLen, inputLen)
    }

    handleClickOutside() {
        if (this.props.hide && !this.props.comment.length) {
            this.props.hide()
        }
    }

    private hideTagPicker = () => this.setState({ isTagPickerShown: false })
    private handleCancel = () => this.props.onCancel()
    private handleSave = async (
        shouldShare: boolean,
        isProtected?: boolean,
    ) => {
        const saveP = this.props.onSave(shouldShare, isProtected)

        if (
            this.markdownPreviewRef?.current?.markdownPreviewRef.current?.state
                .showPreview
        ) {
            this.markdownPreviewRef.current.markdownPreviewRef.current.togglePreview()
        }

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

        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault()
            insertTab({ el: this.textAreaRef.current })
        }

        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            uninsertTab({ el: this.textAreaRef.current })
        }
    }

    private renderTagPicker() {
        const { tags, onTagsUpdate } = this.props
        const setPickerShown = (isTagPickerShown: boolean) =>
            this.setState({ isTagPickerShown })

        const tagPicker = !this.state.isTagPickerShown ? null : (
            <HoverBox>
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

        return (
            <div>
                <TagHolder
                    tags={tags}
                    deleteTag={(tag) =>
                        onTagsUpdate(tags.filter((t) => t !== tag))
                    }
                    clickHandler={() =>
                        setPickerShown(!this.state.isTagPickerShown)
                    }
                />
                {tagPicker}
            </div>
        )
    }

    private renderActionButtons() {
        return (
            <FooterStyled>
                <Flex>
                    <SaveBtn onSave={this.handleSave} />
                    <ButtonTooltip tooltipText="esc" position="bottomSidebar">
                        <CancelBtnStyled onClick={this.handleCancel}>
                            Cancel
                        </CancelBtnStyled>
                    </ButtonTooltip>
                </Flex>
            </FooterStyled>
        )
    }

    render() {
        return (
            <TextBoxContainerStyled>
                <MarkdownPreviewAnnotationInsertMenu
                    ref={this.markdownPreviewRef}
                    customRef={this.textAreaRef}
                    onKeyDown={this.handleInputKeyDown}
                    value={this.props.comment}
                    updateInputValue={this.props.onCommentChange}
                    renderInput={(inputProps) => (
                        <StyledTextArea
                            {...inputProps}
                            value={this.props.comment}
                            onClick={this.hideTagPicker}
                            placeholder={`Add private note. Save with ${AnnotationCreate.MOD_KEY}+enter (+shift to share)`}
                            onChange={(e) =>
                                this.props.onCommentChange(e.target.value)
                            }
                        />
                    )}
                />
                {this.props.comment !== '' && (
                    <>
                        {this.renderTagPicker()}
                        {this.renderActionButtons()}
                    </>
                )}
            </TextBoxContainerStyled>
        )
    }
}

export default onClickOutside(AnnotationCreate)

const TextBoxContainerStyled = styled.div`
    box-shadow: none;
    cursor: default;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    width: 100%;
    box-shadow: rgb(0 0 0 / 10%) 0px 1px 2px 0px;
    border-radius: 5px;
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
    margin: 0 5px 3px 5px;
    height: 26px;
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
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const Flex = styled.div`
    display: flex;
    padding: 0 5px 5px;
    justify-content: flex-end;
`
