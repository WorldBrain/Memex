import React from 'react'
import PropTypes from 'prop-types'

const StepOnboardingIcon = props => (
    <svg width={52} height={52} fill="none" {...props}>
        <circle opacity={0.3} cx={26} cy={26} r={26} fill={props.circleFill} />
        <path
            d="M30.55 25.35l-8.125-5.687a.812.812 0 0 0-1.3.65v11.375a.812.812 0 0 0 1.3.65l8.125-5.688a.846.846 0 0 0 0-1.3z"
            fill={props.triangleFill}
        />
    </svg>
)

StepOnboardingIcon.defaultProps = {
    circleFill: '#5CD9A6',
    triangleFill: '#2AB98A',
}

StepOnboardingIcon.propTypes = {
    circleFill: PropTypes.string,
    triangleFill: PropTypes.string,
}

export default StepOnboardingIcon
