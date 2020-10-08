import * as React from 'react'
import styled from 'styled-components'

import { Anchor } from 'src/highlighting/types'
import { ButtonTooltip } from 'src/common-ui/components'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import TextHighlighted from 'src/annotations/components/parts/TextHighlighted'
import { NewAnnotationOptions } from 'src/annotations/types'
import {
    heartEmpty,
    heartFull,
} from 'src/common-ui/components/design-library/icons'
import onClickOutside from 'react-onclickoutside'
import TagInput from 'src/tags/ui/tag-input'

interface AnnotationCreateState {
    isTagPickerShown: boolean
    isBookmarked: boolean
    text: string
    tags: string[]
}

export interface AnnotationCreateEventProps {
    onSave: (newAnnotation: NewAnnotationOptions) => void
    onCancel: () => void
}

export interface AnnotationCreateGeneralProps {
    anchor?: Anchor
    handleClickOutside?: () => void
}

export interface AnnotationCreateProps
    extends AnnotationCreateGeneralProps,
        AnnotationCreateEventProps {
    tagPickerDependencies: GenericPickerDependenciesMinusSave
}

class AnnotationCreate extends React.Component<
    AnnotationCreateProps,
    AnnotationCreateState
> {
    state = {
        isBookmarked: false,
        isTagPickerShown: false,
        text: '',
        tags: [],
    }

    handleClickOutside() {
        if (this.props.handleClickOutside) {
            this.props?.handleClickOutside()
        }
    }

    private handleCancel = () => {
        this.setState({
            text: '',
            isBookmarked: false,
            tags: [],
            isTagPickerShown: false,
        })
    }

    private handleSave = () => {
        this.props.onSave({
            anchor: this.props.anchor,
            isBookmarked: this.state.isBookmarked,
            tags: this.state.tags,
            text: this.state.text,
        })
        this.setState({
            text: '',
            isBookmarked: false,
            tags: [],
            isTagPickerShown: false,
        })
    }

    private hideTagPicker = () => this.setState({ isTagPickerShown: false })

    private handleInputKeyDown: React.KeyboardEventHandler = (e) => {
        // Allow escape keydown to bubble up to close the sidebar if note text entered
        if (e.key === 'Escape' && !this.state.text.length) {
            return
        }

        e.stopPropagation()

        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.handleSave()
            return
        }
    }

    private renderHighlight() {
        if (!this.props.anchor) {
            return
        }

        return (
            <TextHighlighted
                anchor={this.props.anchor}
                truncateHighlight={false}
                setTruncateHighlight={() => {}}
            />
        )
    }

    private renderInput() {
        return (
            <StyledTextArea
                autoFocus
                value={this.state.text}
                onClick={this.hideTagPicker}
                placeholder="Add private note (save with cmd/ctrl+enter)"
                onChange={(e) => this.setState({ text: e.target.value })}
                onKeyDown={this.handleInputKeyDown}
            />
        )
    }

    private renderTagPicker() {
        const { tagPickerDependencies } = this.props
        const { isTagPickerShown } = this.state

        return (
            <TagInput
                queryTagSuggestions={tagPickerDependencies.queryEntries}
                updateTags={async ({ selected: tags }) =>
                    this.setState({ tags })
                }
                isTagInputActive={isTagPickerShown}
                setTagInputActive={(isShown) =>
                    this.setState({ isTagPickerShown: isShown })
                }
                tags={this.state.tags}
                fetchInitialTagSuggestions={
                    tagPickerDependencies.loadDefaultSuggestions
                }
                deleteTag={async (tag) =>
                    this.setState({
                        tags: this.state.tags.filter((_tag) => _tag !== tag),
                    })
                }
            />
        )
    }

    private renderActionButtons() {
        const { onCancel } = this.props

        return (
            <FooterStyled>
                {/*<InteractionItemsBox>
                    <ButtonTooltip tooltipText="Favorite" position="bottom">
                        <InteractionsImgContainerStyled
                            onClick={() =>
                                this.setState((state) => ({
                                    isBookmarked: !state.isBookmarked,
                                }))
                            }
                        >
                            <ImgButtonStyled
                                src={
                                    this.state.isBookmarked
                                        ? heartFull
                                        : heartEmpty
                                }
                            />
                        </InteractionsImgContainerStyled>
                    </ButtonTooltip>
                </InteractionItemsBox>
                */}

                <Flex>
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="bottom"
                    >
                        <SaveBtnStyled onClick={this.handleSave}>
                            Add
                        </SaveBtnStyled>
                    </ButtonTooltip>
                    <CancelBtnStyled onClick={this.handleCancel}>
                        Cancel
                    </CancelBtnStyled>
                </Flex>
            </FooterStyled>
        )
    }

    render() {
        return (
            <TextBoxContainerStyled>
                {this.renderHighlight()}
                {this.renderInput()}
                {this.state.text !== '' && (
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
    margin: 10px 10px 5px 10px;
    height: ${(props) => (props.value === '' ? '40px' : '150px')};

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
