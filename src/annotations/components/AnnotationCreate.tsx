import * as React from 'react'
import { Tooltip } from 'src/common-ui/components'
import TextInputControlled from 'src/common-ui/components/TextInputControlled'
import { browser } from 'webextension-polyfill-ts'
import TagPicker from 'src/tags/ui/TagPicker'
import { PickerUpdateHandler } from 'src/common-ui/GenericPicker/types'
import styled from 'styled-components'
import { ClickHandler } from 'src/in-page-ui/sidebar/react/types'
import { Anchor } from 'src/highlighting/types'
import TextHighlighted from 'src/annotations/components/TextHighlighted'

const tagEmpty = browser.extension.getURL('/img/tag_empty.svg')
const tagFull = browser.extension.getURL('/img/tag_full.svg')
const heartEmpty = browser.extension.getURL('/img/star_empty.svg')
const heartFull = browser.extension.getURL('/img/star_full.svg')

interface OwnProps {
    env?: 'inpage' | 'overview'
    tags: string[]
    commentText: string
    isCommentBookmarked: boolean
    handleCommentTextChange: (comment: string) => void
    saveComment: React.EventHandler<React.SyntheticEvent>
    cancelComment: ClickHandler<HTMLDivElement>
    toggleBookmark: ClickHandler<HTMLDivElement>
    toggleTagPicker: () => void
    queryTagSuggestions: (query: string) => Promise<string[]>
    fetchInitialTagSuggestions: () => Promise<string[]>
    updateTags: PickerUpdateHandler
    anchor?: Anchor
    form: Omit<CommentBoxFormProps, 'saveComment'>
}

interface CommentBoxFormStateProps {
    isTagInputActive: boolean
    showTagsPicker: boolean
}

export type CommentBoxFormProps = OwnProps & CommentBoxFormStateProps

class AnnotationCreate extends React.Component<CommentBoxFormProps> {
    private handleTagBtnClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleTagPicker()
    }

    private handleCancelBtnClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.cancelComment(e)
    }

    private handleBookmarkBtnClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleBookmark(e)
    }

    private saveComment = (e) => {
        this.props.saveComment(e)
    }

    setTagInputActive = (isTagInputActive: boolean) => {
        this.setState({ isTagInputActive })
    }

    onEnterSaveHandler = {
        test: (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter',
        handle: (e) => this.saveComment(e),
    }

    handleClickOutside(e) {
        this.props.cancelComment(e)
    }

    save = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        const { anchor, form, saveComment } = this.props

        return saveComment(
            anchor,
            form.commentText.trim(),
            form.tags,
            form.isCommentBookmarked,
        )
    }

    render() {
        const { anchor, isCommentBookmarked } = this.props
        return (
            <CommentBoxContainerStyled>
                {!!anchor && (
                    <TextHighlighted
                        anchor={anchor}
                        truncateHighlight={false}
                        setTruncateHighlight={() => {}}
                    />
                )}

                <TextInputControlledStyled
                    defaultValue={this.props.commentText}
                    onClick={() => {
                        this.setTagInputActive(false)
                        this.setState((state) => ({ showTagsPicker: false }))
                    }}
                    placeholder="Add a private note... (save with cmd/ctrl+enter)"
                    onChange={this.props.handleCommentTextChange}
                    specialHandlers={[this.onEnterSaveHandler]}
                />

                <FooterStyled>
                    <Flex>
                        <InteractionsImgContainerStyled>
                            <ImgButtonStyled src={tagEmpty} />
                        </InteractionsImgContainerStyled>
                        <InteractionsImgContainerStyled>
                            <ImgButtonStyled
                                src={
                                    isCommentBookmarked ? heartFull : heartEmpty
                                }
                            />
                        </InteractionsImgContainerStyled>
                    </Flex>
                    <Flex>
                        <CancelBtnStyled>Cancel</CancelBtnStyled>
                        <SaveBtnStyled>Save</SaveBtnStyled>
                    </Flex>
                </FooterStyled>

                <TagDropdownStyled>
                    {this.props.showTagsPicker && (
                        <Tooltip position="bottomLeft">
                            <TagPicker
                                queryEntries={this.props.queryTagSuggestions}
                                onUpdateEntrySelection={this.props.updateTags}
                                loadDefaultSuggestions={
                                    this.props.fetchInitialTagSuggestions
                                }
                                onEscapeKeyDown={this.props.toggleTagPicker}
                            />
                        </Tooltip>
                    )}
                </TagDropdownStyled>
            </CommentBoxContainerStyled>
        )
    }
}

export default AnnotationCreate

const CommentBoxContainerStyled = styled.div`
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
