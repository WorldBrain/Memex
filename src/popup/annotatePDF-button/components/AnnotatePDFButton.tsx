import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'

import Button from '../../components/Button'
import { RootState } from '../../types'
import * as popup from '../../selectors'
import { browser } from 'webextension-polyfill-ts'

const styles = require('./AnnotatePDFButton.css')

export interface OwnProps {}

interface StateProps {
    isDisabled: boolean
}

interface DispatchProps {}

type Props = OwnProps & StateProps & DispatchProps

export class AnnotatePDFButton extends PureComponent<Props> {
    openPDFinNewTab() {
        // browser.tabs.getCurrent().then(tab => {
        //     browser.tabs.create({
        //         url: `web/view.html?file=${tab.url}`,
        //     })
        // })
        browser.tabs.create({
            url:
                'web/viewer.html?file=file%3A%2F%2F%2Fhome%2Faswin1999%2FDownloads%2FHS210%2520Life%2520Skills.pdf',
        })
    }
    render() {
        console.log(this.props.isDisabled)
        return (
            <Button
                onClick={this.openPDFinNewTab}
                disabled={this.props.isDisabled}
                btnClass={styles.tag}
            >
                Annotate PDF
            </Button>
        )
    }
}

const mapState: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
    props,
) => ({
    isDisabled: !popup.isPDF(state),
})

const mapDispatch = (dispatch): DispatchProps => ({})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapState,
    mapDispatch,
)(AnnotatePDFButton)
