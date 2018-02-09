import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Tooltip.css'
import tooltips from './tooltips'

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
    tooltipIndex,
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
                <div className={localStyles.tooltipTitle}>
                    {tooltips[tooltipIndex].title}
                </div>
                <div
                    className={localStyles.tooltipDesc}
                    dangerouslySetInnerHTML={{
                        __html: tooltips[tooltipIndex].description,
                    }}
                />
            </div>
        )}
    </div>
)

Tooltip.propTypes = {
    showTooltip: PropTypes.bool.isRequired,
    toggleShowTooltip: PropTypes.func.isRequired,
    tooltipIndex: PropTypes.number.isRequired,
    onClickRefreshTooltip: PropTypes.func.isRequired,
}

export default Tooltip
