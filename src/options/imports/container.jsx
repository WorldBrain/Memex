import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import ButtonTooltip from '../../common-ui/components/button-tooltip'
import * as selectors from './selectors'
import * as actions from './actions'
import * as constants from './constants'
import { ProgressBar } from 'src/common-ui/components'
import Import from './components/Import'
import EstimatesTable from './components/EstimatesTable'
import ProgressTable from './components/ProgressTable'
import ActionButton from './components/ActionButton'
import ButtonBar from './components/ButtonBar'
import DownloadDetails from './components/DownloadDetails'
import DownloadDetailsRow from './components/DownloadDetailsRow'
import StatusReport from './components/StatusReport'
// import ShowDownloadDetails from './components/ShowDownloadDetails'
import * as searchBarActs from 'src/overview/search-bar/actions'
import styles from './components/ActionButton.css'
import { OPTIONS_URL } from 'src/constants'

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
        allowTypes: PropTypes.object.isRequired,
        blobUrl: PropTypes.string,
        // Misc
        boundActions: PropTypes.object.isRequired,
        search: PropTypes.func.isRequired,
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
        this.props.search()
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

    setAllowType = type => () => this.props.boundActions.setAllowType(type)

    renderHelpText = () =>
        this.state.waitingOnCancelConfirm ? 'Press cancel again to confirm' : ''

    handleInputFile = event => {
        const input = event.target
        if (!input.files[0]) {
            return
        }
        const file = input.files[0]
        this.props.boundActions.prepareImport()
        this.props.boundActions.setBlobUrl(URL.createObjectURL(file))
        setTimeout(() => this.props.recalcEsts(), 500)
    }

    renderCancelButton = () => (
        <ActionButton
            handleClick={this.handleCancelBtnClick}
            isHidden={!this.props.shouldRenderProgress}
            customClass={'cancel'}
        >
            {this.state.waitingOnCancelConfirm ? 'Confirm Cancel' : 'Cancel'}
        </ActionButton>
    )

    renderImportButton() {
        const {
            boundActions,
            blobUrl,
            allowTypes,
            isStartBtnDisabled,
        } = this.props

        const isDisabled =
            allowTypes[constants.IMPORT_TYPE.OTHERS] ===
                constants.IMPORT_SERVICES.POCKET ||
            allowTypes[constants.IMPORT_TYPE.OTHERS] ===
                constants.IMPORT_SERVICES.NETSCAPE
                ? !blobUrl
                : isStartBtnDisabled

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
                <div className={styles.finishBntContainer}>
                    <ActionButton
                        customClass={'newImport'}
                        handleClick={this.handleBtnClick(boundActions.finish)}
                    >
                        Start new import
                    </ActionButton>
                    <ActionButton
                        customClass={'dashboard'}
                        handleClick={() =>
                            window.open(`${OPTIONS_URL}#/overview`)
                        }
                    >
                        Go to dashboard
                    </ActionButton>
                </div>
            )
        }

        // Idle state case
        return (
            <ActionButton
                handleClick={this.handleBtnClick(boundActions.start)}
                isDisabled={isDisabled}
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
            onAllowPocketClick={this.setAllowType(
                constants.IMPORT_SERVICES.POCKET,
            )}
            onAllowHTMLClick={this.setAllowType(
                constants.IMPORT_SERVICES.NETSCAPE,
            )}
            onInputImport={this.handleInputFile}
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
        <React.Fragment>
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
        </React.Fragment>
    )

    renderStatusReport = () => (
        <React.Fragment>
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
        </React.Fragment>
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
                <React.Fragment>
                    <ButtonTooltip
                        tooltipText="Recalculate Numbers"
                        position="bottom"
                    >
                        <ActionButton
                            handleClick={this.props.recalcEsts}
                            customClass="recalc"
                        >
                            <span className={styles.reCalc} />
                        </ActionButton>
                    </ButtonTooltip>
                </React.Fragment>
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
    blobUrl: selectors.blobUrl(state),
    showDownloadDetails: selectors.showDownloadDetails(state),
    downloadDataFilter: selectors.downloadDataFilter(state),
})

const mapDispatchToProps = dispatch => ({
    boundActions: bindActionCreators(actions, dispatch),
    recalcEsts: () => dispatch(actions.recalcEsts()),
    search: () => dispatch(searchBarActs.search({ overwrite: true })),
})

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
