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

class TooltipContainer extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
        createAndCopyDirectLink: PropTypes.func.isRequired,
        openSettings: PropTypes.func.isRequired,
        destroy: PropTypes.func.isRequired,
    }

    state = {
        showTooltip: false,
        position: { x: 250, y: 200 },
        tooltipState: 'pristine',
        linkURL: '',
    }

    componentDidMount() {
        this.props.onInit(this.showTooltip)

        document.addEventListener('keypress', this.justStoryBook)
    }

    componentWillUnmount() {
        document.removeEventListener('keypress', this.justStoryBook)
    }

    justStoryBook = e => {
        console.log('beep boop', e.key)
        if (e.key === 'l')
            this.setState({
                showTooltip: true,
                position: { x: 250, y: 250 },
                tooltipState: 'running',
            })
        else if (e.key === 'c')
            this.setState({
                showTooltip: true,
                position: { x: 250, y: 250 },
                tooltipState: 'copied',
            })
        else if (e.key === 'p')
            this.setState({
                showTooltip: true,
                position: { x: 250, y: 250 },
                tooltipState: 'pristine',
            })
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

export default OnClickOutside(TooltipContainer)
