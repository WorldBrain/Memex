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

    renderCancelButton() {
        const { isStopped, boundActions } = this.props
        const { waitingOnCancelConfirm } = this.state

        const handleClick = e => {
            e.preventDefault()

            // Only cancel running import after second confirmation
            if (!waitingOnCancelConfirm) {
                this.flipCancelState(true)
            } else {
                this.flipCancelState(false)
                boundActions.stopImport()
            }
        }

        return (
            <ActionButton handleClick={handleClick} isHidden={isStopped}>
                Cancel import
            </ActionButton>
        )
    }

    renderImportButton() {
        const { isLoading, isPaused, boundActions } = this.props
        const { allowImportBookmarks, allowImportHistory } = this.state

        if (isLoading) {
            const handleClick = e => this.onButtonClick(e, boundActions.pauseImport)
            return <ActionButton handleClick={handleClick}>Pause</ActionButton>
        }

        if (isPaused) {
            const handleClick = e => this.onButtonClick(e, boundActions.resumeImport)
            return <ActionButton handleClick={handleClick}>Resume</ActionButton>
        }

        const isDisabled = !allowImportHistory && !allowImportBookmarks
        const handleClick = e => this.onButtonClick(e, boundActions.startImport)

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
        const { allowImportBookmarks: bookmarks, allowImportHistory: history, waitingOnCancelConfirm } = this.state
        const {
            isLoading, isStopped, bookmarksProgress, historyProgress,
            bookmarksStats, historyStats, downloadEsts,
        } = this.props

        return (
            <Import>
                {isStopped
                    ? <EstimatesTable
                        onAllowImportBookmarksClick={() => this.onAllowImportBookmarksClick()}
                        onAllowImportHistoryClick={() => this.onAllowImportHistoryClick()}
                        allowImport={{ bookmarks, history }}
                        downloadEsts={downloadEsts}
                        historyStats={historyStats}
                        bookmarksStats={bookmarksStats}
                    />
                    : <ProgressTable bookmarks={bookmarksProgress} history={historyProgress} />
                }
                <ButtonBar isLoading={isLoading} isStopped={isStopped} showCancelText={waitingOnCancelConfirm}>
                    {this.renderCancelButton()}
                    {this.renderImportButton()}
                </ButtonBar>
                {!isStopped
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
    isLoading: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    downloadData: PropTypes.arrayOf(PropTypes.object).isRequired,
    historyProgress: PropTypes.object.isRequired,
    bookmarksProgress: PropTypes.object.isRequired,
    historyStats: PropTypes.object.isRequired,
    bookmarksStats: PropTypes.object.isRequired,
    downloadEsts: PropTypes.object.isRequired,

    // Misc
    boundActions: PropTypes.object.isRequired,
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    downloadData: selectors.downloadDetailsData(state),
    historyProgress: selectors.historyProgress(state),
    bookmarksProgress: selectors.bookmarksProgress(state),
    historyStats: selectors.historyStats(state),
    bookmarksStats: selectors.bookmarksStats(state),
    downloadEsts: selectors.downloadTimeEstimates(state),
})

const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
