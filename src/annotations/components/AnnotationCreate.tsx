import * as React from 'react'
import styled from 'styled-components'
import onClickOutside from 'react-onclickoutside'

import { ButtonTooltip } from 'src/common-ui/components'
import { MarkdownPreviewAnnotationInsertMenu } from 'src/markdown-preview/markdown-preview-insert-menu'
import TagInput from 'src/tags/ui/tag-input'
import { FocusableComponent } from './types'
import { insertTab, uninsertTab } from 'src/common-ui/utils'
import { DropdownMenuBtn } from 'src/common-ui/components/dropdown-menu-btn'
import { AnnotationPrivacyLevels } from '../types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SharePrivacyOption from 'src/overview/sharing/components/SharePrivacyOption'
import { getKeyName } from 'src/util/os-specific-key-names'

interface State {
    isTagPickerShown: boolean
    isPrivacyLevelShown: boolean
    savePrivacyLevel: AnnotationPrivacyLevels
}

export interface AnnotationCreateEventProps {
    onSave: (privacyLevel: AnnotationPrivacyLevels) => Promise<void>
    onCancel: () => void
    onTagsUpdate: (tags: string[]) => void
    onCommentChange: (text: string) => void
}

export interface AnnotationCreateGeneralProps {
    hide?: () => void
    comment: string
    tags: string[]
    autoFocus?: boolean
}

export interface Props
    extends AnnotationCreateGeneralProps,
        AnnotationCreateEventProps {}

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
        isPrivacyLevelShown: false,
        savePrivacyLevel: AnnotationPrivacyLevels.PRIVATE,
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
    private handleSave = async (privacyLevel: AnnotationPrivacyLevels) => {
        const saveP = this.props.onSave(privacyLevel)

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

        // If we don't have this, events will bubble up into the page!
        e.stopPropagation()

        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            const privacyLevel = e.shiftKey
                ? AnnotationPrivacyLevels.PROTECTED
                : e.altKey
                ? AnnotationPrivacyLevels.SHARED
                : AnnotationPrivacyLevels.PRIVATE
            return this.handleSave(privacyLevel)
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

    private setSavePrivacyLevel = (
        savePrivacyLevel: AnnotationPrivacyLevels,
    ) => () =>
        this.setState({
            isPrivacyLevelShown: false,
            savePrivacyLevel,
        })

    private renderTagPicker() {
        return (
            <TagInput
                updateTags={async ({ selected }) =>
                    this.props.onTagsUpdate(selected)
                }
                isTagInputActive={this.state.isTagPickerShown}
                setTagInputActive={(isTagPickerShown) =>
                    this.setState({ isTagPickerShown })
                }
                tags={this.props.tags}
                deleteTag={(tag) =>
                    this.props.onTagsUpdate(
                        this.props.tags.filter((_tag) => _tag !== tag),
                    )
                }
            />
        )
    }

    private renderSaveBtn() {
        return (
            <SaveBtn>
                <SaveBtnText
                    onClick={() => this.handleSave(this.state.savePrivacyLevel)}
                >
                    <Icon
                        icon={
                            this.state.savePrivacyLevel ===
                            AnnotationPrivacyLevels.PROTECTED
                                ? 'lock'
                                : this.state.savePrivacyLevel ===
                                  AnnotationPrivacyLevels.PRIVATE
                                ? 'person'
                                : 'shared'
                        }
                        height="10px"
                    />{' '}
                    Save
                </SaveBtnText>
                <SaveBtnArrow>
                    <DropdownMenuBtn
                        btnChildren={<Icon icon="triangle" height="10px" />}
                        isOpen={this.state.isPrivacyLevelShown}
                        toggleOpen={() =>
                            this.setState((state) => ({
                                isPrivacyLevelShown: !state.isPrivacyLevelShown,
                            }))
                        }
                    >
                        <SharePrivacyOption
                            title="Protected"
                            shortcut={`shift+${AnnotationCreate.MOD_KEY}+enter`}
                            description="Sharing status will not change in bulk actions"
                            icon="lock"
                            onClick={this.setSavePrivacyLevel(
                                AnnotationPrivacyLevels.PROTECTED,
                            )}
                        />
                        <SharePrivacyOption
                            title="Private"
                            shortcut={`${AnnotationCreate.MOD_KEY}+enter`}
                            description="Private to you, until shared (in bulk)"
                            icon="person"
                            onClick={this.setSavePrivacyLevel(
                                AnnotationPrivacyLevels.PRIVATE,
                            )}
                        />
                        <SharePrivacyOption
                            title="Shared"
                            shortcut={`${AnnotationCreate.ALT_KEY}+${AnnotationCreate.MOD_KEY}+enter`}
                            description="Added to shared collections & page links"
                            icon="shared"
                            onClick={this.setSavePrivacyLevel(
                                AnnotationPrivacyLevels.SHARED,
                            )}
                        />
                    </DropdownMenuBtn>
                </SaveBtnArrow>
            </SaveBtn>
        )
    }

    private renderActionButtons() {
        return (
            <FooterStyled>
                <Flex>
                    {this.renderSaveBtn()}
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
                            placeholder={`Add private note (save with ${AnnotationCreate.MOD_KEY}+enter)`}
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
        font-family: 'Poppins', sans-serif;
    }
`

const StyledTextArea = styled.textarea`
    background-color: white;
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
    width: auto;
    min-height: 40px;

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
    margin: 0 5px 3px 5px;
    height: 26px;
    animation: slideIn 0.2s ease-in-out;
    animation-fill-mode: forwards;
`

const SaveBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-item: center;
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

const SaveBtnText = styled.span`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const SaveBtnArrow = styled.span``

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
    padding: 0 5px 5px;
    justify-content: flex-end;
`
