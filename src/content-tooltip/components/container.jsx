import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'

import Tooltip from './tooltip'
import * as components from './tooltipStates'

class Container extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
    }

    state = {
        showTooltip: false,
        position: {},
        tooltipState: 'copied',
    }

    componentDidMount() {
        this.props.onInit(this.showTooltip)
    }

    showTooltip = position =>
        this.setState({
            showTooltip: true,
            position,
        })

    handleClickOutside = () =>
        this.setState({
            showTooltip: false,
            position: {},
        })

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                return components.initialComponent
            case 'running':
                return components.creatingLinkComponent
            case 'done':
                return components.createdLinkComponent
            case 'copied':
                return components.copiedComponent
            default:
                return components.errorComponent
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state
        console.log(position)
        return (
            <div className="memex-tooltip-container">
                {showTooltip ? (
                    <Tooltip
                        {...position}
                        state={tooltipState}
                        tooltipComponent={this.renderTooltipComponent()}
                    />
                ) : null}
            </div>
        )
    }
}

export default OnClickOutside(Container)
