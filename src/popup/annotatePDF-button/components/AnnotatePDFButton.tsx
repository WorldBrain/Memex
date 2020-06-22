import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'
import LinkButton from '../../components/LinkButton'
import { OPTIONS_URL } from '../../../constants'

import { PDF_VIEWER_URL } from 'src/pdf-viewer/constants'
import Button from '../../components/Button'
import { remoteFunction } from 'src/util/webextensionRPC'

const styles = require('./AnnotatePDFButton.css')

interface Props {
    pdfURL: string
    pdfFingerprint: string
}

export default class AnnotatePDFButton extends PureComponent<Props> {
    handleClick = (e) => {
        e.preventDefault()
        browser.tabs.query({ active: true }).then((tabs) => {
            browser.tabs.update(tabs[0].id, {
                // url: PDF_VIEWER_URL + encodeURI(this.props.pdfURL),
                // url: `PDF_VIEWER_URL/${1}`,
                // url: PDF_VIEWER_URL,
                url: `${OPTIONS_URL}#/pdf-viewer/${this.props.pdfFingerprint}`,
            })
        })
    }
    render() {
        return (
            <LinkButton
                // btnClass={btnStyles.openIcon}
                href={`${OPTIONS_URL}#/pdf-viewer/${this.props.pdfFingerprint}`}
                // href={`${OPTIONS_URL}#/pdf-viewer/${1}`}
                // href={`${
                //     constants.OPTIONS_URL
                // }#/pdf-viewer/${this.props.url.replace(
                //     /(^\w+:|^)\/\//,
                //     '',
                // ).substring(0, url.lastIndexOf(\".\")}`}
            >
                Annotate PDF
            </LinkButton>
            // <Button onClick={this.handleClick} btnClass={styles.tag}>
            //     Annotate PDF
            // </Button>
        )
    }
}
