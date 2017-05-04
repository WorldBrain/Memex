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

    getDownloadEsts() {
        const { bookmarksStats: { timeEstim: bookmarksTime }, historyStats: { timeEstim: historyTime } } = this.props

        const getHours = time => Math.floor(time / 60)
        const getMins = time => time - getHours(time) * 60
        const getTimeEstStr = time => `${getHours(time)}:${getMins(time)} h`

        return {
            bookmarks: getTimeEstStr(bookmarksTime),
            history: getTimeEstStr(historyTime),
        }
    }

    renderStopButton() {
        const { isLoading, isPaused, boundActions: { stopImport } } = this.props

        const isDisabled = !isLoading && !isPaused

        return (
            <ActionButton handleClick={stopImport} isDisabled={isDisabled}>
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
        const { isLoading, isStopped, bookmarksProgress, historyProgress } = this.props
        const { allowImportBookmarks: bookmarks, allowImportHistory: history } = this.state

        return (
            <Import>
                {isStopped
                    ? <EstimatesTable
                        onAllowImportBookmarksClick={() => this.onAllowImportBookmarksClick()}
                        onAllowImportHistoryClick={() => this.onAllowImportHistoryClick()}
                        downloadEsts={this.getDownloadEsts()}
                        allowImport={{ bookmarks, history }}
                        {...this.props}
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
    isLoading: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    isStopped: PropTypes.bool.isRequired,
    boundActions: PropTypes.object.isRequired,
    downloadData: PropTypes.arrayOf(PropTypes.object).isRequired,
    historyProgress: PropTypes.object.isRequired,
    bookmarksProgress: PropTypes.object.isRequired,
    historyStats: PropTypes.shape({
        timeEstim: PropTypes.number,
    }),
    bookmarksStats: PropTypes.shape({
        timeEstim: PropTypes.number,
    }),
}

const mapStateToProps = state => ({
    isLoading: selectors.isLoading(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isCheckboxDisabled: selectors.isCheckboxDisabled(state),
    downloadData: selectors.downloadDetailsData(state),
    historyProgress: selectors.historyProgress(state),
    bookmarksProgress: selectors.bookmarksProgress(state),
    historyStats: { // demo statistics
        saved: 3000,
        sizeEngaged: 600,
        notDownloaded: 1500,
        sizeRequired: 300,
        timeEstim: 80,
    },
    bookmarksStats: { // demo statistics
        saved: 4000,
        sizeEngaged: 350,
        notDownloaded: 2000,
        sizeRequired: 350,
        timeEstim: 130,
    },

})

const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
