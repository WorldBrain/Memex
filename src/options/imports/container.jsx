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
import ButtonBar from './components/ButtonBar'
import DownloadDetails from './components/DownloadDetails'
import DownloadDetailsRow from './components/DownloadDetailsRow'
import StatusReport from './components/StatusReport'
import { acts as searchBarActs } from 'src/overview/search-bar'
import { OPTIONS_URL } from 'src/constants'
import AdvSettings from '../imports/components/AdvSettingsContainer'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'
import styled from 'styled-components'

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

        this.flipCancelState = (waitingOnCancelConfirm) =>
            this.setState((state) => ({ ...state, waitingOnCancelConfirm }))
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

    setCancelState = (waitingOnCancelConfirm) =>
        this.setState((state) => ({ ...state, waitingOnCancelConfirm }))

    handleDetailsRowClick = (rowId) => () =>
        this.setState((state) => ({
            ...state,
            activeRow: rowId,
            waitingOnCancelConfirm: false,
        }))

    handleBtnClick = (action) => (e) => {
        e.preventDefault()
        this.setCancelState(false)
        action()
    }

    handleCancelBtnClick = (e) => {
        e.preventDefault()

        // Only cancel running import after second confirmation
        if (!this.state.waitingOnCancelConfirm) {
            this.setCancelState(true)
        } else {
            this.setCancelState(false)
            this.props.boundActions.stop()
        }
    }

    handleEstTableCheck = (type) => () =>
        this.props.boundActions.toggleAllowType(type)

    setAllowType = (type) => () => this.props.boundActions.setAllowType(type)

    renderHelpText = () =>
        this.state.waitingOnCancelConfirm ? 'Press cancel again to confirm' : ''

    handleInputFile = (event) => {
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
        <SecondaryAction
            onClick={this.handleCancelBtnClick}
            isHidden={!this.props.shouldRenderProgress}
            label={
                <ButtonContent>
                    <Icon
                        filePath={icons.stop}
                        heightAndWidth="14px"
                        color="purple"
                        hoverOff
                    />
                    {this.state.waitingOnCancelConfirm
                        ? 'Confirm Cancel'
                        : 'Cancel'}
                </ButtonContent>
            }
        />
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
                <PrimaryAction
                    onClick={this.handleBtnClick(boundActions.pause)}
                    label={
                        <ButtonContent>
                            <Icon
                                filePath={icons.pause}
                                heightAndWidth="14px"
                                color="white"
                                hoverOff
                            />
                            Pause Import
                        </ButtonContent>
                    }
                />
            )
        }

        if (this.props.isPaused) {
            return (
                <PrimaryAction
                    onClick={this.handleBtnClick(boundActions.resume)}
                    label={
                        <ButtonContent>
                            <Icon
                                filePath={icons.playFull}
                                heightAndWidth="14px"
                                color="white"
                                hoverOff
                            />
                            Resume Import
                        </ButtonContent>
                    }
                />
            )
        }

        if (this.props.isStopped) {
            return (
                <FinishBntContainer>
                    <SecondaryAction
                        onClick={this.handleBtnClick(boundActions.finish)}
                        label={
                            <ButtonContent>
                                <Icon
                                    filePath={icons.redo}
                                    heightAndWidth="14px"
                                    color="purple"
                                    hoverOff
                                />
                                Start new import
                            </ButtonContent>
                        }
                    >
                        Start new import
                    </SecondaryAction>
                    <PrimaryAction
                        onClick={() => window.open(`${OPTIONS_URL}#/overview`)}
                        label={
                            <ButtonContent>
                                <Icon
                                    filePath={icons.searchIcon}
                                    heightAndWidth="14px"
                                    color="white"
                                    hoverOff
                                />
                                Go to dashboard
                            </ButtonContent>
                        }
                    />
                </FinishBntContainer>
            )
        }

        // Idle state case
        return (
            <PrimaryAction
                onClick={this.handleBtnClick(boundActions.start)}
                isDisabled={isDisabled}
                customClass={'startImport'}
                type="submit"
                label={
                    <ButtonContent>
                        <Icon
                            filePath={icons.playFull}
                            heightAndWidth="14px"
                            color="white"
                            hoverOff
                        />
                        Start Import
                    </ButtonContent>
                }
            />
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
        this.setState((state) => ({
            ...state,
            activeRow: rowId,
            waitingOnCancelConfirm: false,
        }))
    }

    getDetailFilterHandlers() {
        const { boundActions } = this.props

        const updateFilterState = (filter) => () => {
            this.onDetailsRowClick(-1) // Simulate anti-click to reset state of active details row
            boundActions.filterDownloadDetails(filter)
        }

        return {
            all: (e) =>
                this.onButtonClick(e, updateFilterState(constants.FILTERS.ALL)),
            succ: (e) =>
                this.onButtonClick(
                    e,
                    updateFilterState(constants.FILTERS.SUCC),
                ),
            fail: (e) =>
                this.onButtonClick(
                    e,
                    updateFilterState(constants.FILTERS.FAIL),
                ),
        }
    }

    renderProgressTable = () => (
        <React.Fragment>
            <ProgressBar progress={this.props.progressPercent} />
            <ProgressTable
                {...this.props}
                changeShowDetails={this.props.boundActions.showDownloadDetails}
                showDownloadDetails={this.props.showDownloadDetails}
            />
            {/* <ShowDownloadDetails
                changeShowDetails={this.props.boundActions.showDownloadDetails}
                showDownloadDetails={this.props.showDownloadDetails}
            /> */}
            {this.props.showDownloadDetails && (
                <>
                    <SectionTitleSmall />
                    {/* <InfoText>
                    Please report URLs that fail but should not, so we can improve the import process.
                </InfoText> */}
                    <DownloadDetails
                        filterHandlers={this.getDetailFilterHandlers()}
                        filter={this.props.downloadDataFilter}
                    >
                        {this.renderDownloadDetailsRows()}
                    </DownloadDetails>
                </>
            )}
        </React.Fragment>
    )

    renderStatusReport = () => (
        <React.Fragment>
            <StatusReport
                {...this.props}
                changeShowDetails={this.props.boundActions.showDownloadDetails}
            >
                {this.props.showDownloadDetails
                    ? 'Hide Error Details'
                    : 'Show Error Details'}
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

    renderSettings() {
        if (!this.props.shouldRenderEsts) {
            return
        }

        return <AdvSettings />
    }

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
                        <Icon
                            onClick={this.props.recalcEsts}
                            heightAndWidth="16px"
                            filePath={icons.reload}
                        />
                    </ButtonTooltip>
                </React.Fragment>
            )}
            {this.props.isRunning && this.renderCancelButton()}
            {this.renderImportButton()}
        </ButtonBar>
    )

    render() {
        return (
            <Import {...this.props}>
                {this.renderMainTable()}
                {this.renderSettings()}
                {this.renderButtonBar()}
            </Import>
        )
    }
}

const mapStateToProps = (state) => ({
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

const mapDispatchToProps = (dispatch) => ({
    boundActions: bindActionCreators(actions, dispatch),
    recalcEsts: () => dispatch(actions.recalcEsts()),
    search: () => dispatch(searchBarActs.search({ overwrite: true })),
})

const FinishBntContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
`

const ButtonContent = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 5px;
    align-items: center;
    justify-content: center;
`

const SectionTitleSmall = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid ${(props) => props.theme.colors.lineGrey};
`

export default connect(mapStateToProps, mapDispatchToProps)(ImportContainer)
