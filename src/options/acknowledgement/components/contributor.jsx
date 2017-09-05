import React from 'react'
import PropTypes from 'prop-types'
import localStyles from './styles.css'

const AcknowledgementContainer = ({contributor}) => (
	<div className={localStyles.li}>
		<img className={localStyles.img} src={contributor.image}/><p className={localStyles.p}><span className={localStyles.name}> {contributor.name} | </span> <span className={localStyles.position}>{contributor.position}</span><br/><a className={localStyles.web} href={contributor.web}>{contributor.web}</a></p>
	</div>
)

export const propTypes = AcknowledgementContainer.propTypes = {
    contributor: PropTypes.object.isRequired
}

export default AcknowledgementContainer
