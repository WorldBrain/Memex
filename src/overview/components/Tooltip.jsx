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

const Tooltip = ({
    showTooltip,
    toggleShowTooltip,
    tooltipIndex,
    onClickRefreshTooltip,
}) => (
    <div className={mainTooltipContainer(showTooltip)}>
        <div className={localStyles.tooltipButton}>
            {showTooltip && (
                <div
                    className={localStyles.refreshIcon}
                    onClick={onClickRefreshTooltip}
                    title="Click so new new tip"
                />
            )}
            <div onClick={toggleShowTooltip}>
                {showTooltip ? 'Hide Tips' : 'Show Tooltips'}
            </div>
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
