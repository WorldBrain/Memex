import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import Tooltip from './tooltip'
import { createDirectLink } from 'src/direct-linking/content_script/interactions'
import {
    InitialComponent,
    CreatingLinkComponent,
    CreatedLinkComponent,
    CopiedComponent,
    ErrorComponent,
} from './tooltipStates'
import { copyToClipboard } from '../utils'
import { OPEN_OPTIONS } from 'src/search-injection/constants'

class Container extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
    }

    state = {
        showTooltip: false,
        position: {},
        tooltipState: 'pristine',
        linkURL: '',
    }

    componentDidMount() {
        this.props.onInit(this.showTooltip)
    }

    showTooltip = position => {
        if (this.state.tooltipState !== 'running')
            this.setState({
                showTooltip: true,
                position,
                tooltipState: 'pristine',
            })
    }

    handleClickOutside = () => {
        const selection = document.getSelection()
        selection.removeAllRanges()
        this.setState({
            showTooltip: false,
            position: {},
        })
    }

    closeTooltip = event => {
        event.preventDefault()
        event.stopPropagation()
        const selection = document.getSelection()
        selection.removeAllRanges()
        this.setState({
            showTooltip: false,
            position: {},
        })
    }

    setTooltipState = state =>
        this.setState({
            tooltipState: state,
        })

    createLink = async () => {
        this.setState({
            tooltipState: 'running',
        })
        const { url } = await createDirectLink()
        this.setState({
            tooltipState: 'done',
            linkURL: url,
        })
    }

    copyLinkToClipboard = event => {
        event.preventDefault()
        copyToClipboard(this.state.linkURL)
        this.setState({
            tooltipState: 'copied',
        })
    }

    openSettings = event => {
        event.preventDefault()
        const message = {
            action: OPEN_OPTIONS,
            query: 'settings',
        }
        browser.runtime.sendMessage(message)
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return <InitialComponent createLink={this.createLink} />
            case 'running':
                return <CreatingLinkComponent />
            case 'done':
                return (
                    <CreatedLinkComponent
                        link={this.state.linkURL}
                        copyFunc={this.copyLinkToClipboard}
                    />
                )
            case 'copied':
                return <CopiedComponent />
            default:
                return <ErrorComponent />
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state
        return (
            <div className="memex-tooltip-container">
                {showTooltip ? (
                    <Tooltip
                        {...position}
                        state={tooltipState}
                        tooltipComponent={this.renderTooltipComponent()}
                        closeTooltip={this.closeTooltip}
                        openSettings={this.openSettings}
                    />
                ) : null}
            </div>
        )
    }
}

export default OnClickOutside(Container)
