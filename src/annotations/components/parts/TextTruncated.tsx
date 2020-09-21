import * as React from 'react'
import styled from 'styled-components'

interface Props {
    text: string
    getTruncatedTextObject: (
        text: string,
    ) => {
        isTextTooLong: boolean
        text: string
    }
    isHighlight: boolean
}

import * as icons from 'src/common-ui/components/design-library/icons'

interface State {
    shouldTruncate: boolean

}

class TextTruncated extends React.Component<Props, State> {
    static defaultProps: Partial<Props> = {
        text: '',
    }

    state = {
        shouldTruncate: true,
    }

    componentDidMount() {
        const { text, getTruncatedTextObject } = this.props
        const { isTextTooLong } = getTruncatedTextObject(text)
        this.setState({ shouldTruncate: isTextTooLong })
    }

    componentDidUpdate(prevProps: Props) {
        const { text, getTruncatedTextObject } = this.props
        if (text !== prevProps.text) {
            const { isTextTooLong } = getTruncatedTextObject(text)
            this.setState({ shouldTruncate: isTextTooLong })
        }
    }

    private _toggleTextTruncation = (e: React.MouseEvent) => {
        e.stopPropagation()
        this.setState((prevState) => ({
            shouldTruncate: !prevState.shouldTruncate,
        }))
    }

    render() {
        const { text, getTruncatedTextObject } = this.props
        const { isTextTooLong, text: truncatedText } = getTruncatedTextObject(
            text,
        )
        const { shouldTruncate } = this.state
        const textToBeDisplayed = shouldTruncate ? truncatedText : text

        return (
            <React.Fragment>
                {this.props.isHighlight && (
                    <TextToBeDisplayed>{textToBeDisplayed}</TextToBeDisplayed>
                )}

                {!this.props.isHighlight && (
                    <TextBox>
                        <TextToBeDisplayed>{textToBeDisplayed}</TextToBeDisplayed>
                        <IconStyled/>
                    </TextBox>
                )}
                <CommentTextBox>
                    {isTextTooLong && (
                        <ToggleMoreButtonStyled
                            onClick={this._toggleTextTruncation}
                        >
                            {shouldTruncate ? 'Show More' : 'Show Less'}
                        </ToggleMoreButtonStyled>
                    )}
                </CommentTextBox>
            </React.Fragment>
        )
    }
}

const IconStyled = styled.button`
    border: none;
    z-index: 2500;
    outline: none;
    border-radius: 3px;
    width: 20px;
    height: 20px;
    opacity: 0.6;
    position: absolute;
    right: 5px;
    top: 5px;
    padding: 3px;
    display: none;
    background-color: #3a2f45;
    mask-image: url(${icons.commentEditFull});
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 16px;
`

const TextBox = styled.div`  
    position: relative;
    min-height: 30px;
    display: flex;
    align-items: center;

    &: hover {
        background-color: #e0e0e0;
        border-radius: 3px;
        cursor: pointer;
        
        &:hover ${IconStyled} {
            display: flex;
          }

    }
`


const TextToBeDisplayed = styled.span`
    box-decoration-break: clone;
    padding: 0 5px;
`

const ToggleMoreButtonStyled = styled.div`
    margin: 2px 0 0 -3px;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 3px;
    font-size 12px;
    color: grey;
    line-height: 18px;

    &: hover {
        background-color: #e0e0e0;
        color: #3a2f45;
    }
`

const CommentTextBox = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
`

export default TextTruncated
