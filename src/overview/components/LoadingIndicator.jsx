import React from 'react'
import styles from './LoadingIndicator.css'
import classNames from 'classnames'

const LoadingIndicator = () => {
	return (
		<div className={styles.container}> 
			<span className={classNames(styles.dotone, styles.dot)}></span>
			<span className={classNames(styles.dottwo,styles.dot)}></span>
			<span className={classNames(styles.dotthree,styles.dot)}></span>
		</div>
	)
}

export default LoadingIndicator
