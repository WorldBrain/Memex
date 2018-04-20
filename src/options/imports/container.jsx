import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'
import { Wrapper, ProgressBar } from 'src/common-ui/components'
import Import from './components/Import'
import EstimatesTable from './components/EstimatesTable'
import ProgressTable from './components/ProgressTable'
import ActionButton from './components/ActionButton'
import ButtonBar from './components/ButtonBar'
import DownloadDetails from './components/DownloadDetails'
import DownloadDetailsRow from './components/DownloadDetailsRow'
import StatusReport from './components/StatusReport'
import AdvSettingCheckbox from './components/AdvSettingsCheckbox'
// import ShowDownloadDetails from './components/ShowDownloadDetails'

class ImportContainer extends Component {
    static propTypes = {
        // State
        isRunning: PropTypes.bool.isRequired,
        isPaused: PropTypes.bool.isRequired,
        isStopped: PropTypes.bool.isRequired,
        shouldRenderEsts: PropTypes.bool.isRequired,
        shouldRenderProgress: PropTypes.bool.isRequired,
        isStartBtnDisabled: PropTypes.bool.isRequired,
        downloadData: PropTypes.arrayOf(PropTypes.object).isRequired,
        progressPercent: PropTypes.number.isRequired,
        showDownloadDetails: PropTypes.bool.isRequired,
        downloadDataFilter: PropTypes.string.isRequired,
        recalcEsts: PropTypes.func.isRequired,

        // Misc
        boundActions: PropTypes.object.isRequired,
    }

    constructor(props) {
        super(props)
        props.boundActions.init()

        this.flipCancelState = waitingOnCancelConfirm =>
            this.setState(state => ({ ...state, waitingOnCancelConfirm }))
    }

    state = {
        waitingOnCancelConfirm: false,
        activeRow: -1,
    }

    componentWillUnmount() {
        if (this.props.isRunning) {
            this.props.boundActions.pause()
        } else if (!this.props.isPaused) {
            this.props.boundActions.prepareImport()
        }
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

    handleEstTableCheck = type => () =>
        this.props.boundActions.toggleAllowType(type)

    renderHelpText = () =>
        this.state.waitingOnCancelConfirm ? 'Press cancel again to confirm' : ''

    renderCancelButton = () => (
        <ActionButton
            handleClick={this.handleCancelBtnClick}
            isHidden={!this.props.shouldRenderProgress}
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
                type="submit"
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

    renderEstimatesTable = () => (
        <EstimatesTable
            {...this.props}
            onAllowBookmarksClick={this.handleEstTableCheck(
                constants.IMPORT_TYPE.BOOKMARK,
            )}
            onAllowHistoryClick={this.handleEstTableCheck(
                constants.IMPORT_TYPE.HISTORY,
            )}
        />
    )

    onButtonClick(e, handleClick) {
        e.preventDefault()
        this.flipCancelState(false)
        handleClick()
    }

    onDetailsRowClick(rowId) {
        this.setState(state => ({
            ...state,
            activeRow: rowId,
            waitingOnCancelConfirm: false,
        }))
    }

    getDetailFilterHandlers() {
        const { boundActions } = this.props

        const updateFilterState = filter => () => {
            this.onDetailsRowClick(-1) // Simulate anti-click to reset state of active details row
            boundActions.filterDownloadDetails(filter)
        }

        return {
            all: e =>
                this.onButtonClick(e, updateFilterState(constants.FILTERS.ALL)),
            succ: e =>
                this.onButtonClick(
                    e,
                    updateFilterState(constants.FILTERS.SUCC),
                ),
            fail: e =>
                this.onButtonClick(
                    e,
                    updateFilterState(constants.FILTERS.FAIL),
                ),
        }
    }

    renderProgressTable = () => (
        <Wrapper>
            <ProgressBar progress={this.props.progressPercent} />
            <ProgressTable {...this.props} />
            {/* <ShowDownloadDetails
                changeShowDetails={this.props.boundActions.showDownloadDetails}
                showDownloadDetails={this.props.showDownloadDetails}
            /> */}
            {this.props.showDownloadDetails && (
                <DownloadDetails
                    filterHandlers={this.getDetailFilterHandlers()}
                    filter={this.props.downloadDataFilter}
                >
                    {this.renderDownloadDetailsRows()}
                </DownloadDetails>
            )}
        </Wrapper>
    )

    renderStatusReport = () => (
        <Wrapper>
            <StatusReport
                {...this.props}
                changeShowDetails={this.props.boundActions.showDownloadDetails}
            >
                {/* {this.props.showDownloadDetails
                    ? 'Hide Details'
                    : 'Show Details'} */}
            </StatusReport>
            {this.props.showDownloadDetails && (
                <DownloadDetails
                    filterHandlers={this.getDetailFilterHandlers()}
                    filter={this.props.downloadDataFilter}
                >
                    {this.renderDownloadDetailsRows()}
                </DownloadDetails>
            )}
        </Wrapper>
    )

    renderMainTable() {
        if (this.props.shouldRenderEsts) {
            return this.renderEstimatesTable()
        }

        if (this.props.shouldRenderProgress) {
            return this.renderProgressTable()
        }

        return this.renderStatusReport()
    }

    renderButtonBar = () => (
        <ButtonBar helpText={this.renderHelpText()} {...this.props}>
            {this.props.shouldRenderEsts && (
                <Wrapper>
                    <AdvSettingCheckbox {...this.props} />
                    <ActionButton
                        handleClick={this.props.recalcEsts}
                        customClass="recalc"
                    >
                        <i className="material-icons">autorenew</i>
                    </ActionButton>
                </Wrapper>
            )}
            {this.renderCancelButton()}
            {this.renderImportButton()}
        </ButtonBar>
    )

    render() {
        return (
            <Import {...this.props}>
                {this.renderMainTable()}
                {this.renderButtonBar()}
            </Import>
        )
    }
}

const mapStateToProps = state => ({
    isRunning: selectors.isRunning(state),
    isPaused: selectors.isPaused(state),
    isStopped: selectors.isStopped(state),
    isLoading: selectors.isLoading(state),
    shouldRenderEsts: selectors.shouldRenderEsts(state),
    shouldRenderProgress: selectors.shouldRenderProgress(state),
    isStartBtnDisabled: selectors.isStartBtnDisabled(state),
    downloadData: selectors.downloadDetailsData(state),
    estimates: selectors.estimates(state),
    progress: selectors.progress(state),
    progressPercent: selectors.progressPercent(state),
    successCount: selectors.successCount(state),
    failCount: selectors.failCount(state),
    allowTypes: selectors.allowTypes(state),
    loadingMsg: selectors.loadingMsg(state),
    advMode: selectors.advMode(state),
    showDownloadDetails: selectors.showDownloadDetails(state),
    downloadDataFilter: selectors.downloadDataFilter(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
    recalcEsts: () => dispatch(actions.recalcEsts()),
    toggleAdvMode: () => dispatch(actions.toggleAdvMode()),
})

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
