import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import { ButtonTooltip } from 'src/common-ui/components'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import { MarkdownPreview } from 'src/common-ui/components/markdown-preview'
import TagInput from 'src/tags/ui/tag-input'
import { FocusableComponent } from './types'

interface State {
    isTagPickerShown: boolean
}

export interface AnnotationCreateEventProps {
    onSave: () => Promise<void>
    onCancel: () => void
    onTagsUpdate: (tags: string[]) => void
    onCommentChange: (text: string) => void
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    comment: string
    tags: string[]
}

export interface Props
    extends AnnotationCreateGeneralProps,
        AnnotationCreateEventProps {
    tagPickerDependencies: GenericPickerDependenciesMinusSave
}

export class AnnotationCreate extends React.Component<Props, State>
    implements FocusableComponent {
    private textAreaRef = React.createRef<HTMLTextAreaElement>()
    private markdownPreviewRef = React.createRef<MarkdownPreview>()
    state = { isTagPickerShown: false }

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
    private handleSave = () => {
        this.props.onSave()

        if (this.markdownPreviewRef?.current?.state.showPreview) {
            this.markdownPreviewRef.current.togglePreview()
        }
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

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()

        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.handleSave()
            return
        }
    }
    private renderTagPicker() {
        const { tagPickerDependencies } = this.props

        return (
            <TagInput
                queryTagSuggestions={tagPickerDependencies.queryEntries}
                updateTags={async ({ selected }) =>
                    this.props.onTagsUpdate(selected)
                }
                isTagInputActive={this.state.isTagPickerShown}
                setTagInputActive={(isTagPickerShown) =>
                    this.setState({ isTagPickerShown })
                }
                tags={this.props.tags}
                fetchInitialTagSuggestions={
                    tagPickerDependencies.loadDefaultSuggestions
                }
                deleteTag={(tag) =>
                    this.props.onTagsUpdate(
                        this.props.tags.filter((_tag) => _tag !== tag),
                    )
                }
            />
        )
    }

    private renderActionButtons() {
        return (
            <FooterStyled>
                <Flex>
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="bottom"
                    >
                        <SaveBtnStyled onClick={this.handleSave}>
                            Add
                        </SaveBtnStyled>
                    </ButtonTooltip>
                    <ButtonTooltip
                        tooltipText="esc"
                        position="bottom"
                    >
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
                <MarkdownPreview
                    ref={this.markdownPreviewRef}
                    customRef={this.textAreaRef}
                    onKeyDown={this.handleInputKeyDown}
                    value={this.props.comment}
                    renderInput={(inputProps) => (
                        <StyledTextArea
                            {...inputProps}
                            value={this.props.comment}
                            onClick={this.hideTagPicker}
                            placeholder="Add private note (save with cmd/ctrl+enter)"
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
    font-size: 13px;
    background: white;
    width: 100%;
    border-radius: 5px;
    box-shadow: rgba(15,15,15,0.1) 0px 0px 0px 1px, rgba(15,15,15,0.1) 0px 2px 4px;

    &:hover {
        background: white;
    }

    & * {
        font-family: 'Poppins', sans-serif;
    }
`

const StyledTextArea = styled.textarea`
    background-color: #f7f7f7;
    box-sizing: border-box;
    resize: vertical;
    font-weight: 400;
    font-size: 14px;
    color: #222;
    font-family: 'Poppins', sans-serif;
    border-radius: 3px;
    border: none;
    padding: 10px 7px;
    height: ${(props) => (props.value === '' ? '40px' : '150px')};
    margin-bottom: -3px;
    width: auto;

    &::placeholder {
        color: #3a2f45;
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
    margin: 0px 12px 4px 12px;
    height: 26px;
    animation: slideIn 0.2s ease-in-out;
    animation-fill-mode: forwards;
`

const SaveBtnStyled = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;

    &:focus {
        background-color: grey;
    }

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
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
const ConfirmBtnStyled = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    padding: 3px 5px;
    border: none;
    outline: none;
    margin-right: -6px;
    background: transparent;

    &:hover {
        background-color: #e0e0e0;
    }

    &:focus {
        background-color: #79797945;
    }
`

const InteractionsImgContainerStyled = styled.button`
    border: none;
    background: none;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 3px;
    outline: none;

    &:hover {
        opacity: 0.8;
        background-color: #e0e0e0;
    }
`
const InteractionItemsBox = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 24px);
    grid-gap: 3px;
    justify-content: center;
    align-items: center;
    direction: rtl;
`

const ImgButtonStyled = styled.img`
    width: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 16px;
    opacity: 0.6;
    background-color: transparent;
    cursor: pointer;
    outline: none;

    &:active {
        opacity: 1;
    }
`

const Flex = styled.div`
    display: flex;
`
