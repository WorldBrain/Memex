import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import { SHOULD_OPEN_STORAGE_KEY as SHOULD_OPEN } from '../constants'
import PDFOptions from './PDFOptions'
import { pdf } from 'src/util/remote-functions-background'

class PDFOptionsContainer extends React.PureComponent {
    static DEF_OPENING = false

    static propTypes = {
        openChange: PropTypes.func.isRequired,
    }

    async componentDidMount() {
        const storage = await browser.storage.local.get({
            [SHOULD_OPEN]: PDFOptionsContainer.DEF_OPENING,
        })

        this.props.openChange(storage[SHOULD_OPEN], true)
    }

    handleOpenChange = async (event) => {
        const shouldOpen =
            event.target.value === 'y' || event.target.value === true

        // Storage flag must be set before event open else analytics manager will ignore in case of switching on
        if (shouldOpen) {
            await browser.storage.local.set({ [SHOULD_OPEN]: shouldOpen })
            await this.props.openChange(shouldOpen)
        } else {
            await this.props.openChange(shouldOpen)
            await browser.storage.local.set({ [SHOULD_OPEN]: shouldOpen })
        }

        pdf.refreshSetting()
    }

    render() {
        return (
            <PDFOptions
                handleOpenChange={this.handleOpenChange}
                {...this.props}
            />
        )
    }
}

const mapStateToProps = (state) => ({
    shouldOpen: selectors.shouldOpen(state),
})

const mapDispatchToProps = (dispatch) => ({
    openChange: (shouldOpen, skipEventOpen = false) =>
        dispatch(actions.toggleOpeningOptOut(shouldOpen, skipEventOpen)),
})

export default connect(mapStateToProps, mapDispatchToProps)(PDFOptionsContainer)
