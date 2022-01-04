import React, { PureComponent } from 'react'
import Button from './Button'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    currentPageUrl?: string
}

interface State {
    isCopied?: boolean
}

class CopyPDFLinkButton extends PureComponent<Props, State> {
    state = {
        isCopied: false,
    }

    copyUrl() {
        navigator.clipboard.writeText(
            decodeURIComponent(
                this.props.currentPageUrl.split('?file=')[1].toString(),
            ),
        )
        this.setState({
            isCopied: true,
        })
        setTimeout(
            () =>
                this.setState({
                    isCopied: false,
                }),
            3000,
        )
    }

    render() {
        console.log(this.state.isCopied)
        return (
            <div className={LinkButtonStyles.buttonContainer}>
                <Button
                    onClick={() => this.copyUrl()}
                    btnClass={styles.copy}
                    itemClass={LinkButtonStyles.button}
                >
                    {this.state.isCopied === false ? (
                        <div className={styles.buttonInnerContent}>
                            Copy PDF Url
                        </div>
                    ) : (
                        <div className={styles.buttonInnerContent}>
                            Copied to Clipboard
                        </div>
                    )}
                </Button>
            </div>
        )
    }
}

export default CopyPDFLinkButton
