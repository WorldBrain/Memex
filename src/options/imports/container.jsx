import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { entireState } from './selectors'
import * as actions from './actions'
import Import from './components/Import'
import ImportButton from './components/ImportButton'

class ImportContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            allowImportHistory: true,
            allowImportBookmarks: false,
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

    renderImportButton() {
        const { isLoading, isPaused, boundActions: { pauseImport, resumeImport, startImport } } = this.props
        const { allowImportBookmarks, allowImportHistory } = this.state

        const isDisabled = !allowImportHistory && !allowImportBookmarks
        const getProps = handleClick => ({ handleClick, isDisabled })

        if (isLoading) {
            return <ImportButton {...getProps(pauseImport)}>Pause</ImportButton>
        }

        if (isPaused) {
            return <ImportButton {...getProps(resumeImport)}>Resume</ImportButton>
        }

        return <ImportButton {...getProps(startImport)}>Start import</ImportButton>
    }

    render() {
        const { allowImportBookmarks: bookmarks, allowImportHistory: history } = this.state

        return (
            <Import
                ActionButton={this.renderImportButton()}
                onAllowImportBookmarksClick={() => this.onAllowImportBookmarksClick()}
                onAllowImportHistoryClick={() => this.onAllowImportHistoryClick()}
                downloadEsts={this.getDownloadEsts()}
                allowImport={{ bookmarks, history }}
                {...this.props}
            />
        )
    }
}

ImportContainer.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isPaused: PropTypes.bool.isRequired,
    boundActions: PropTypes.object.isRequired,
    historyStats: PropTypes.shape({
        timeEstim: PropTypes.number,
    }),
    bookmarksStats: PropTypes.shape({
        timeEstim: PropTypes.number,
    }),
}

const mapStateToProps = state => ({
    isLoading: entireState(state).loadingStatus === 'pending'
        || entireState(state).indexRebuildingStatus === 'pending',
    isPaused: entireState(state).loadingStatus === 'paused',
    isCheckboxDisabled: entireState(state).loadingStatus !== 'stopped',
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
