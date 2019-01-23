import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import { browser } from 'webextension-polyfill-ts'

const styles = require('./AnnotatePDFButton.css')

interface Props {
    pdfURL: string
}

export default class AnnotatePDFButton extends PureComponent<Props> {
    handleClick = e => {
        e.preventDefault()
        browser.tabs.create({
            url: `web/viewer.html?file=${encodeURI(this.props.pdfURL)}`,
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
