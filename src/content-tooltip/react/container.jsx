import React from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'
import Tooltip from './tooltip'

class Container extends React.Component {
    static propTypes = {
        onInit: PropTypes.func.isRequired,
    }

    state = {
        showTooltip: false,
        position: {},
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

    render() {
        const { showTooltip, position } = this.state
        return (
            <div className="memex-tooltip-container">
                {showTooltip ? <Tooltip {...position} /> : null}
            </div>
        )
    }
}

export default OnClickOutside(Container)
