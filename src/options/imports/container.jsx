import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'
import { Wrapper } from 'src/common-ui/components'
import Import from './components/Import'
import EstimatesTable from './components/EstimatesTable'
import ProgressTable from './components/ProgressTable'
import ProgressBar from './components/ProgressBar'
import ActionButton from './components/ActionButton'
import ButtonBar from './components/ButtonBar'
import DownloadDetails from './components/DownloadDetails'
import DownloadDetailsRow from './components/DownloadDetailsRow'
import StatusReport from './components/StatusReport'
import DevCheckBox from './components/DevCheckBox'

class ImportContainer extends Component {
    static propTypes = {
        // State
        isRunning: PropTypes.bool.isRequired,
        isPaused: PropTypes.bool.isRequired,
        isStopped: PropTypes.bool.isRequired,
        isLoading: PropTypes.bool.isRequired,
        isIdle: PropTypes.bool.isRequired,
        isStartBtnDisabled: PropTypes.bool.isRequired,
        downloadData: PropTypes.arrayOf(PropTypes.object).isRequired,
        progressPercent: PropTypes.number.isRequired,

        // Misc
        boundActions: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)
        props.boundActions.init()
    }

    state = {
        waitingOnCancelConfirm: false,
        activeRow: -1,
    }

    setCancelState = waitingOnCancelConfirm =>
        this.setState(state => ({ ...state, waitingOnCancelConfirm }))

    handleDetailsRowClick = rowId => () =>
        this.setState(state => ({
            ...state,
            activeRow: rowId,
            waitingOnCancelConfirm: false,
        }))

    handleBtnClick = action => e => {
        e.preventDefault()
        this.setCancelState(false)
        action()
    }

    handleCancelBtnClick = e => {
        e.preventDefault()

        // Only cancel running import after second confirmation
        if (!this.state.waitingOnCancelConfirm) {
            this.setCancelState(true)
        } else {
            this.setCancelState(false)
            this.props.boundActions.stop()
        }
    }

    getDetailFilterHandlers() {
        const { boundActions } = this.props

        const updateFilterState = filter => () => {
            this.handleDetailsRowClick(-1)() // Simulate anti-click to reset state of active details row
            boundActions.filterDownloadDetails(filter)
        }

        return {
            all: this.handleBtnClick(updateFilterState(constants.FILTERS.ALL)),
            succ: this.handleBtnClick(
                updateFilterState(constants.FILTERS.SUCC),
            ),
            fail: this.handleBtnClick(
                updateFilterState(constants.FILTERS.FAIL),
            ),
        }
    }

    handleEstTableCheck = type => () =>
        this.props.boundActions.toggleAllowType(type)

    getEstTableProps = () => ({
        ...this.props,
        onAllowBookmarksClick: this.handleEstTableCheck(
            constants.IMPORT_TYPE.BOOKMARK,
        ),
        onAllowHistoryClick: this.handleEstTableCheck(
            constants.IMPORT_TYPE.HISTORY,
        ),
        onAllowOldExtClick: this.handleEstTableCheck(constants.IMPORT_TYPE.OLD),
    })

    renderHelpText = () =>
        this.state.waitingOnCancelConfirm ? 'Press cancel again to confirm' : ''

    renderCancelButton = () => (
        <ActionButton
            handleClick={this.handleCancelBtnClick}
            isHidden={this.props.isIdle}
            isDisabled={this.props.isStopped}
            customClass={'cancel'}
        >
            Cancel
        </ActionButton>
    )

    renderImportButton() {
        const { boundActions } = this.props

        if (this.props.isRunning) {
            return (
                <ActionButton
                    customClass={'pause'}
                    handleClick={this.handleBtnClick(boundActions.pause)}
                >
                    Pause
                </ActionButton>
            )
        }

        if (this.props.isPaused) {
            return (
                <ActionButton
                    customClass={'resume'}
                    handleClick={this.handleBtnClick(boundActions.resume)}
                >
                    Resume
                </ActionButton>
            )
        }

        if (this.props.isStopped) {
            return (
                <ActionButton
                    customClass={'newImport'}
                    handleClick={this.handleBtnClick(boundActions.finish)}
                >
                    Start new import
                </ActionButton>
            )
        }

        // Idle state case
        return (
            <ActionButton
                handleClick={this.handleBtnClick(boundActions.start)}
                isDisabled={this.props.isStartBtnDisabled}
                customClass={'startImport'}
            >
                Start import
            </ActionButton>
        )
    }

    renderDownloadDetailsRows = () =>
        this.props.downloadData.map((data, i) => (
            <DownloadDetailsRow
                key={i}
                isActive={i === this.state.activeRow}
                handleClick={this.handleDetailsRowClick(i)}
                {...data}
            />
        ))

    render() {
        const {
            boundActions,
            isRunning,
            isIdle,
            isLoading,
            isStopped,
            isPaused,
            progressPercent,
        } = this.props

        return (
            <Import {...this.props}>
                {(isIdle || isLoading) && (
                    <EstimatesTable {...this.getEstTableProps()} />
                )}
                {(isRunning || isPaused) && (
                    <Wrapper>
                        <ProgressBar progress={progressPercent} />
                        <ProgressTable {...this.props} />
                    </Wrapper>
                )}
                {isStopped && (
                    <Wrapper>
                        <StatusReport
                            {...this.props}
                            changeShowDetails={boundActions.showDownloadDetails}
                        />
                        <DownloadDetails
                            {...this.props}
                            filterHandlers={this.getDetailFilterHandlers()}
                        >
                            {this.renderDownloadDetailsRows()}
                        </DownloadDetails>
                    </Wrapper>
                )}
                <ButtonBar
                    isRunning={this.props.isRunning}
                    helpText={this.renderHelpText()}
                >
                    {(isIdle || isLoading) && <DevCheckBox {...this.props} />}
                    {!isStopped && this.renderCancelButton()}
                    {this.renderImportButton()}
                </ButtonBar>
            </Import>
        )
    }
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isLoading: selectors.isLoading(state),
    isIdle: selectors.isIdle(state),
    isStartBtnDisabled: selectors.isStartBtnDisabled(state),
    showOldExt: selectors.showOldExt(state),
    downloadData: selectors.downloadDetailsData(state),
    estimates: selectors.estimates(state),
    progress: selectors.progress(state),
    progressPercent: selectors.progressPercent(state),
    successCount: selectors.successCount(state),
    failCount: selectors.failCount(state),
    allowTypes: selectors.allowTypes(state),
    loadingMsg: selectors.loadingMsg(state),
    devMode: selectors.devMode(state),
    showDownloadDetails: selectors.showDownloadDetails(state),
    downloadDataFilter: selectors.downloadDataFilter(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
    toggleDevMode: () => dispatch(actions.toggleDevMode()),
})

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
