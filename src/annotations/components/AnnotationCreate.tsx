import * as React from 'react'
import styled from 'styled-components'
import { Anchor } from 'src/highlighting/types'
import { Tooltip } from 'src/common-ui/components'
import { ButtonTooltip } from 'src/common-ui/components'
import TagPicker from 'src/tags/ui/TagPicker'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import TextHighlighted from 'src/annotations/components/parts/TextHighlighted'
import { NewAnnotationOptions } from 'src/annotations/types'
import {
    tagEmpty,
    tagFull,
    heartEmpty,
    heartFull,
} from 'src/common-ui/components/design-library/icons'

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

    private handleSave = () =>
        this.props.onSave({
            anchor: this.props.anchor,
            isBookmarked: this.state.isBookmarked,
            tags: this.state.tags,
            text: this.state.text,
        })

    private hideTagPicker = () => this.setState({ isTagPickerShown: false })

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
        const onEnterSaveHandler = {
            test: (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
            handle: (e) => this.handleSave(),
        }

        return (
            <TextInputControlledStyled
                defaultValue={this.state.text}
                onClick={this.hideTagPicker}
                placeholder="Add a private note... (save with cmd/ctrl+enter)"
                onChange={(text) => this.setState({ text })}
                specialHandlers={[onEnterSaveHandler]}
            />
        )
    }

    private renderTagPicker() {
        const { tagPickerDependencies } = this.props
        const { isTagPickerShown } = this.state

        return (
            <TagDropdownStyled>
                {isTagPickerShown && (
                    <Tooltip position="bottomLeft">
                        <TagPicker
                            onEscapeKeyDown={this.hideTagPicker}
                            {...tagPickerDependencies}
                            onUpdateEntrySelection={async ({
                                selected: tags,
                            }) => this.setState({ tags })}
                        />
                    </Tooltip>
                )}
            </TagDropdownStyled>
        )
    }

    private renderActionButtons() {
        const { onCancel } = this.props

        return (
            <FooterStyled>
                <InteractionItemsBox>
                    <InteractionsImgContainerStyled>
                        <ImgButtonStyled
                            src={tagEmpty}
                            onClick={() =>
                                this.setState((state) => ({
                                    isTagPickerShown: !state.isTagPickerShown,
                                }))
                            }
                        />
                    </InteractionsImgContainerStyled>
                    <ButtonTooltip
                        tooltipText="Favorite"
                        position="bottom"
                    >
                        <InteractionsImgContainerStyled>
                            <ImgButtonStyled
                                src={
                                    this.state.isBookmarked ? heartFull : heartEmpty
                                }
                                onClick={() =>
                                    this.setState((state) => ({
                                        isBookmarked: !state.isBookmarked,
                                    }))
                                }
                            />
                        </InteractionsImgContainerStyled>
                    </ButtonTooltip>
                </InteractionItemsBox>
                <Flex>
                    <ButtonTooltip
                        tooltipText="ctrl/cmd + Enter"
                        position="bottom"
                    >
                        <SaveBtnStyled onClick={this.handleSave}>
                            Save
                        </SaveBtnStyled>
                    </ButtonTooltip>
                    <CancelBtnStyled onClick={onCancel}>
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
                {this.renderActionButtons()}
                {this.renderTagPicker()}
            </TextBoxContainerStyled>
        )
    }
}

export default AnnotationCreate

const TextBoxContainerStyled = styled.div`
    box-shadow: none;
    margin-top: 1px;
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

const TextInputControlledStyled = styled(TextInputControlled)`
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
    margin: 5px 10px 5px 10px;
    min-height: 100px;
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
    justify-content: space-between;
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
        background-color: #e0e0e0
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
        background-color: #e0e0e0
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
        background-color: #e0e0e0
    }

    &:focus {
        background-color: #79797945;
    }
`

const InteractionsImgContainerStyled = styled.div`
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 3px;
    
    &:hover {
        opacity: 0.8;
        background-color: #e0e0e0
    }
`
const InteractionItemsBox = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 24px);
    grid-gap: 3px;
    justify-content: center;
    align-items: center;
`

const ImgButtonStyled = styled.img`
    width: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 18px;
    opacity: 0.6;
    background-color: transparent;
    cursor: pointer;


    &:active {
        opacity: 1;
    }
`

const TagDropdownStyled = styled.span`
    position: relative;
    top: 3px;
    right: 150px;
`

const Flex = styled.div`
    display: flex;
`

