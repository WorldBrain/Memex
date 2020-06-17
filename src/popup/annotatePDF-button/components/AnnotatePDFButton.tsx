import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'

import { PDF_VIEWER_URL } from 'src/pdf-viewer/constants'
import Button from '../../components/Button'

const styles = require('./AnnotatePDFButton.css')

interface Props {
    pdfURL: string
}

export default class AnnotatePDFButton extends PureComponent<Props> {
    handleClick = (e) => {
        e.preventDefault()
        browser.tabs.query({ active: true }).then((tabs) => {
            browser.tabs.update(tabs[0].id, {
                url: PDF_VIEWER_URL + encodeURI(this.props.pdfURL),
            })
        })
    }
    render() {
        return (
            <Button onClick={this.handleClick} btnClass={styles.tag}>
                Annotate PDF
            </Button>
        )
    }
}
