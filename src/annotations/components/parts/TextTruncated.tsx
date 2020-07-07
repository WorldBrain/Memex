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
                {isTextTooLong && (
                    <ToggleMoreButtonStyled
                        onClick={this._toggleTextTruncation}
                    >
                        {shouldTruncate ? 'More' : 'Less'}
                    </ToggleMoreButtonStyled>
                )}
            </React.Fragment>
        )
    }
}

const ToggleMoreButtonStyled = styled.button`
    margin: 5px 0 0 5px;
    cursor: pointer;
    display: inline-block;
    background-image: url('/img/longarrow.svg');
    background-color: transparent;
    background-repeat: no-repeat;
    background-size: 43px;
    width: 40px;
    height: 20px;
    background-position: center;
    transition: transform 0.15s ease-in;
    border: none;
    outline: none;
    transform-origin: center;
    transform: ${({ rotate }) => (rotate ? 'rotate(-180deg)' : 'none')};
`

export default TextTruncated
