import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Tooltip.css'

const mainTooltipContainer = showTooltip =>
    classNames({
        [localStyles.mainTooltip]: true,
        [localStyles.isActive]: showTooltip,
    })

const tooltipButton = showTooltip =>
    classNames({
        [localStyles.tooltipButtonIcon]: showTooltip,
    })

const Tooltip = ({
    showTooltip,
    toggleShowTooltip,
    tooltip,
    onClickRefreshTooltip,
}) => (
    <div className={mainTooltipContainer(showTooltip)}>
        <div className={localStyles.tooltipButton}>
            <div
                className={tooltipButton(showTooltip)}
                onClick={toggleShowTooltip}
            >
                {!showTooltip && 'Show Tips'}
            </div>
            {showTooltip && (
                <div
                    className={localStyles.refreshIcon}
                    onClick={onClickRefreshTooltip}
                    title="Next Tip"
                />
            )}
        </div>
        {showTooltip && (
            <div className={localStyles.tooltipText}>
                <div className={localStyles.tooltipTitle}>{tooltip.title}</div>
                <div
                    className={localStyles.tooltipDesc}
                    dangerouslySetInnerHTML={{
                        __html: tooltip.description,
                    }}
                />
            </div>
        )}
    </div>
)

Tooltip.propTypes = {
    showTooltip: PropTypes.bool.isRequired,
    toggleShowTooltip: PropTypes.func.isRequired,
    tooltip: PropTypes.object,
    onClickRefreshTooltip: PropTypes.func.isRequired,
}

export default Tooltip
