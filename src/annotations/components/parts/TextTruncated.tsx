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
}

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
            {textToBeDisplayed}
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

const ToggleMoreButtonStyled = styled.div`
    margin: 2px 0 0 -8px;
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
