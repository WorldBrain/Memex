import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'
import Import from './components/Import'
import EstimatesTable from './components/EstimatesTable'
import ProgressTable from './components/ProgressTable'
import ActionButton from './components/ActionButton'
import ButtonBar from './components/ButtonBar'
import DownloadDetails from './components/DownloadDetails'
import DownloadDetailsRow from './components/DownloadDetailsRow'

class ImportContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            allowImportHistory: false,
            allowImportBookmarks: false,
            waitingOnCancelConfirm: false,
            activeRow: -1,
        }

        props.boundActions.init()

        this.flipCancelState = waitingOnCancelConfirm =>
            this.setState(state => ({ ...state, waitingOnCancelConfirm }))
    }

    onAllowImportHistoryClick() {
        this.setState(state => ({
            ...state,
            allowImportHistory: !state.allowImportHistory,
        }))
    }

    onAllowImportBookmarksClick() {
        this.setState(state => ({
            ...state,
            allowImportBookmarks: !state.allowImportBookmarks,
        }))
    }

    onDetailsRowClick(rowId) {
        this.setState(state => ({
            ...state,
            activeRow: rowId,
            waitingOnCancelConfirm: false,
        }))
    }

    onButtonClick(e, handleClick) {
        e.preventDefault()
        this.flipCancelState(false)
        handleClick()
    }

    getDetailFilterHandlers() {
        const { boundActions } = this.props

        const updateFilterState = filter => () => {
            this.onDetailsRowClick(-1) // Simulate anti-click to reset state of active details row
            boundActions.filterDownloadDetails(filter)
        }

        return {
            all: e => this.onButtonClick(e, updateFilterState(constants.FILTERS.ALL)),
            succ: e => this.onButtonClick(e, updateFilterState(constants.FILTERS.SUCC)),
            fail: e => this.onButtonClick(e, updateFilterState(constants.FILTERS.FAIL)),
        }
    }

    renderHelpText() {
        const { isIdle, isStopped } = this.props
        const { waitingOnCancelConfirm } = this.state

        if (isIdle) return 'Downloading may slow down your experience.\nYou can pause and resume anytime'
        if (isStopped) return 'Import has finished.'
        if (waitingOnCancelConfirm) return 'Press cancel again to confirm'
        return ''
    }

    renderCancelButton() {
        const { isStopped, isIdle, boundActions } = this.props
        const { waitingOnCancelConfirm } = this.state

        const handleClick = e => {
            e.preventDefault()

            // Only cancel running import after second confirmation
            if (!waitingOnCancelConfirm) {
                this.flipCancelState(true)
            } else {
                this.flipCancelState(false)
                boundActions.stop()
            }
        }

        return (
            <ActionButton handleClick={handleClick} isHidden={isIdle} isDisabled={isStopped}>
                Cancel import
            </ActionButton>
        )
    }

    renderImportButton() {
        const { isRunning, isStopped, isPaused, boundActions } = this.props
        const { allowImportBookmarks, allowImportHistory } = this.state

        if (isRunning) {
            const handleClick = e => this.onButtonClick(e, boundActions.pause)
            return <ActionButton handleClick={handleClick}>Pause</ActionButton>
        }

        if (isPaused) {
            const handleClick = e => this.onButtonClick(e, boundActions.resume)
            return <ActionButton handleClick={handleClick}>Resume</ActionButton>
        }

        if (isStopped) {
            const handleClick = e => this.onButtonClick(e, boundActions.finishImport)
            return <ActionButton handleClick={handleClick}>Return</ActionButton>
        }

        // Idle state case
        const isDisabled = !allowImportHistory && !allowImportBookmarks
        const handleClick = e => this.onButtonClick(e, boundActions.start)
        return <ActionButton handleClick={handleClick} isDisabled={isDisabled}>Start import</ActionButton>
    }

    renderDownloadDetailsRows() {
        const { activeRow } = this.state
        const { downloadData } = this.props

        return downloadData.map((data, i) => (
            <DownloadDetailsRow
                key={i}
                isActive={i === activeRow}
                handleClick={() => this.onDetailsRowClick(i)}
                {...data}
            />
        ))
    }

    render() {
        const { allowImportBookmarks: bookmarks, allowImportHistory: history } = this.state
        const { isRunning, isIdle, isInit, progress, estimates } = this.props

        const estTableProps = {
            estimates,
            allowImport: { bookmarks, history },
            onAllowImportBookmarksClick: () => this.onAllowImportBookmarksClick(),
            onAllowImportHistoryClick: () => this.onAllowImportHistoryClick(),
        }

        return (
            <Import isInit={isInit}>
                {isIdle
                    ? <EstimatesTable {...estTableProps} />
                    : <ProgressTable progress={progress} />
                }
                <ButtonBar isRunning={isRunning} helpText={this.renderHelpText()}>
                    {this.renderCancelButton()}
                    {this.renderImportButton()}
                </ButtonBar>
                {!isIdle
                    && <DownloadDetails filterHandlers={this.getDetailFilterHandlers()}>
                        {this.renderDownloadDetailsRows()}
                    </DownloadDetails>
                }
            </Import>
        )
    }
}

ImportContainer.propTypes = {
    // State
    isRunning: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    isInit: PropTypes.bool.isRequired,
    isIdle: PropTypes.bool.isRequired,
    downloadData: PropTypes.arrayOf(PropTypes.object).isRequired,
    estimates: PropTypes.object.isRequired,
    progress: PropTypes.object.isRequired,

    // Misc
    boundActions: PropTypes.object.isRequired,
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isInit: selectors.isInit(state),
    isIdle: selectors.isIdle(state),
    downloadData: selectors.downloadDetailsData(state),
    estimates: selectors.estimates(state),
    progress: selectors.progress(state),
})

const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
