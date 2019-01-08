import * as React from 'react'
import cx from 'classnames'

const styles = require('./truncated-text-renderer.css')

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

class TruncatedTextRenderer extends React.Component<Props, State> {
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

    private _toggleTextTruncation = () => {
        this.setState(prevState => ({
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
                "{textToBeDisplayed}"
                {isTextTooLong && (
                    <span
                        className={cx(styles.showMoreBtn, {
                            [styles.rotated]: !shouldTruncate,
                        })}
                        onClick={this._toggleTextTruncation}
                    />
                )}
            </React.Fragment>
        )
    }
}

export default TruncatedTextRenderer
