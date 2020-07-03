import * as React from 'react'
import styled from 'styled-components'
import { browser } from 'webextension-polyfill-ts'
import { Anchor } from 'src/highlighting/types'
import { Tooltip } from 'src/common-ui/components'
import TagPicker from 'src/tags/ui/TagPicker'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { GenericPickerDependenciesMinusSave } from 'src/common-ui/GenericPicker/logic'
import TextHighlighted from 'src/annotations/components/parts/TextHighlighted'
import { NewAnnotationOptions } from 'src/annotations/types'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'

const tagEmpty = browser.extension.getURL('/img/tag_empty.svg')
const tagFull = browser.extension.getURL('/img/tag_full.svg')
const heartEmpty = browser.extension.getURL('/img/star_empty.svg')
const heartFull = browser.extension.getURL('/img/star_full.svg')

interface AnnotationCreateState {
    isTagPickerShown: boolean
    isBookmarked: boolean
    text: string
    tags?: string[]
}

export interface AnnotationCreateEventProps {
    onCancel: () => void
    onSave: (newAnnotation: NewAnnotationOptions) => void
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
        isTagInputActive: false,
        isTagPickerShown: false,
        text: '',
        tags: [],
    }

    setTagInputActive = (isTagPickerShown: boolean) => {
        this.setState({ isTagPickerShown })
    }

    handleClickOutside(e) {
        this.props.onCancel()
    }

    handleSave = async () => {
        this.props.onSave({
            anchor: this.props.anchor,
            isBookmarked: this.state.isBookmarked,
            tags: this.state.tags,
            text: this.state.text,
        })
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

    renderHighlight() {
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

    renderInput() {
        const { text } = this.state

        const onEnterSaveHandler = {
            test: (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
            handle: (e) => this.props.onSave(e),
        }

        return (
            <TextInputControlledStyled
                defaultValue={text}
                onClick={this.hideTagPicker}
                placeholder="Add a private note... (save with cmd/ctrl+enter)"
                onChange={this.handleTextChange}
                specialHandlers={[onEnterSaveHandler]}
            />
        )
    }

    handleTextChange = (text) => {
        this.setState({ text })
    }

    renderTagPicker() {
        const { tagPickerDependencies } = this.props
        const { isTagPickerShown } = this.state

        return (
            <TagDropdownStyled>
                {isTagPickerShown && (
                    <Tooltip position="bottomLeft">
                        <TagPicker
                            onEscapeKeyDown={this.hideTagPicker}
                            {...tagPickerDependencies}
                            onUpdateEntrySelection={this.updateTags}
                        />
                    </Tooltip>
                )}
            </TagDropdownStyled>
        )
    }

    updateTags: PickerUpdateHandler = async (args) => {
        this.setState({ tags: args.selected })
    }

    hideTagPicker = () => {
        this.setState({ isTagPickerShown: false })
    }

    renderActionButtons() {
        const { onCancel } = this.props
        const { isBookmarked } = this.state

        return (
            <FooterStyled>
                <Flex>
                    <InteractionsImgContainerStyled>
                        <ImgButtonStyled src={tagEmpty} />
                    </InteractionsImgContainerStyled>
                    <InteractionsImgContainerStyled>
                        <ImgButtonStyled
                            src={isBookmarked ? heartFull : heartEmpty}
                        />
                    </InteractionsImgContainerStyled>
                </Flex>
                <Flex>
                    <CancelBtnStyled onClick={onCancel}>Cancel</CancelBtnStyled>
                    <SaveBtnStyled onClick={this.handleSave}>
                        Save
                    </SaveBtnStyled>
                </Flex>
            </FooterStyled>
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

    &:hover {
        background: white;
    }

    & * {
        font-family: 'Poppins', sans-serif;
    }
`

const TagInput = styled.div`
    width: 300px;
    height: 18px;
    border-radius: 10px;
    background-color: #fdfbfb;
    margin-left: 8px;
    margin-bottom: 6px;
    font-size: 11px;
    padding: 2px 10px 3px 10px;
    color: #3eb995;
    box-shadow: #0000005c 0px 0px 5px 0px inset;
    border: 0.5px #0000005c solid;

    &::placeholder {
        color: #3eb995;
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
    margin: 5px 5px 5px 5px;
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
    margin: 0px 12px 4px 4px;
    height: 26px;
    animation: slideIn 0.2s ease-in-out;
    animation-fill-mode: forwards;
`

const SaveBtnStyled = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    font-weight: 700;
    outline: none;
    margin-left: 2px;
    background: transparent;

    &:focus {
        background-color: grey;
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
    margin-right: -6px;
    background: transparent;

    &:focus {
        background-color: #79797945;
    }
`
const ConfirmBtnStyled = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    margin-right: -6px;
    background: transparent;

    &:focus {
        background-color: #79797945;
    }
`

const InteractionsImgContainerStyled = styled.div`
    width: 20px;
    height: 18px;
    background-size: contain;
    margin-left: 6px;
`

const ImgButtonStyled = styled.img`
    width: 100%;
    height: 100%;
    opacity: 0.6;
    background-color: transparent;
    cursor: pointer;

    &:hover {
        opacity: 0.75;
    }

    &:active {
        opacity: 1;
    }

    /*    &:focus {
        outline: none;
    } */
`

const Flex = styled.div`
    display: flex;
`

const TagDropdownStyled = styled.span`
    position: relative;
    top: 3px;
    right: 150px;
`
