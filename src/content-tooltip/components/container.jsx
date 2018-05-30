import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import Tooltip from './tooltip'
import {
    InitialComponent,
    CreatingLinkComponent,
    CopiedComponent,
    ErrorComponent,
} from './tooltip-states'
import { copyToClipboard } from '../utils'

class Container extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
        createAndCopyDirectLink: PropTypes.func.isRequired,
        openSettings: PropTypes.func.isRequired,
        destroy: PropTypes.func.isRequired,
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
        this.setState({
            showTooltip: false,
            position: {},
        })
    }

    closeTooltip = event => {
        event.preventDefault()
        event.stopPropagation()
        this.props.destroy()
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
        const { url } = await this.props.createAndCopyDirectLink()
        this.setState({
            tooltipState: 'copied',
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
        this.props.openSettings()
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return <InitialComponent createLink={this.createLink} />
            case 'running':
                return <CreatingLinkComponent />
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
