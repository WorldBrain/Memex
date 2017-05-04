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
            activeRow: -1,
        }
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
        }))
    }

    getDetailFilterHandlers() {
        const { boundActions } = this.props

        const updateFilterState = filter => () => {
            this.onDetailsRowClick(-1) // Simulate anti-click to reset state of active details row
            boundActions.filterDownloadDetails(filter)
        }

        return {
            all: updateFilterState(constants.FILTERS.ALL),
            succ: updateFilterState(constants.FILTERS.SUCC),
            fail: updateFilterState(constants.FILTERS.FAIL),
        }
    }

    renderStopButton() {
        const { isStopped, boundActions: { stopImport } } = this.props

        return (
            <ActionButton handleClick={stopImport} isHidden={isStopped}>
                Cancel import
            </ActionButton>
        )
    }

    renderImportButton() {
        const { isLoading, isPaused, boundActions: { pauseImport, resumeImport, startImport } } = this.props
        const { allowImportBookmarks, allowImportHistory } = this.state

        const isDisabled = !allowImportHistory && !allowImportBookmarks
        const getProps = handleClick => ({ handleClick, isDisabled })

        if (isLoading) {
            return <ActionButton {...getProps(pauseImport)}>Pause</ActionButton>
        }

        if (isPaused) {
            return <ActionButton {...getProps(resumeImport)}>Resume</ActionButton>
        }

        return <ActionButton {...getProps(startImport)}>Start import</ActionButton>
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
                <ButtonBar isLoading={isLoading} isStopped={isStopped}>
                    {this.renderStopButton()}
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
