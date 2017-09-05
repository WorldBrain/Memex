import React from 'react'

import styles from '../options.css'
import localStyles from './styles.css'

const AcknowledgementContainer = () => (
	<div className={localStyles.acknowledgement}>
		<h1 className={styles.routeTitle}>Settings > Acknowledgement</h1>

		<span className={localStyles.title}>> This project can only happen thanks to our talented collaborators.</span>
		
		<div className={localStyles.content}>
			Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
			tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
			quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
			consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
			cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
			proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
		</div>

		<div className={localStyles.col_title}>COLLABORATORS</div>

		<div className={localStyles.ul}>
			<div className={localStyles.li}>
				<img className={localStyles.img} src="https://worldbrain.io/wp-content/uploads/2015/11/oliver-sauter-3-480x480.jpg"/><p className={localStyles.p}><span className={localStyles.name}> Oliver Sauter | </span> <span className={localStyles.position}>CEO</span><br/><a className={localStyles.web} href="https://worldbrain.io/team">https://worldbrain.io/team/</a></p>
			</div>
			<div className={localStyles.li}>
				<img className={localStyles.img} src="https://worldbrain.io/wp-content/uploads/2015/11/oliver-sauter-3-480x480.jpg"/><p className={localStyles.p}><span className={localStyles.name}> ABC | </span> <span className={localStyles.position}>A</span><br/><a className={localStyles.web} href="https://worldbrain.io">https://worldbrain.io</a></p>
			</div>
			<div className={localStyles.li}>
				<img className={localStyles.img} src="https://worldbrain.io/wp-content/uploads/2015/11/oliver-sauter-3-480x480.jpg"/><p className={localStyles.p}><span className={localStyles.name}> XYZ | </span> <span className={localStyles.position}>B</span><br/><a className={localStyles.web} href="https://worldbrain.io">https://worldbrain.io</a></p>
			</div>
			<div className={localStyles.li}>
				<img className={localStyles.img} src="https://worldbrain.io/wp-content/uploads/2015/11/oliver-sauter-3-480x480.jpg"/><p className={localStyles.p}><span className={localStyles.name}> XYZ | </span> <span className={localStyles.position}>C</span><br/><a className={localStyles.web} href="https://worldbrain.io">https://worldbrain.io</a></p>
			</div>
			<div className={localStyles.li}>
				<img className={localStyles.img} src="https://worldbrain.io/wp-content/uploads/2015/11/oliver-sauter-3-480x480.jpg"/><p className={localStyles.p}><span className={localStyles.name}> ABC | </span> <span className={localStyles.position}>D</span><br/><a className={localStyles.web} href="https://worldbrain.io">https://worldbrain.io</a></p>
			</div>
		</div>

		<div className={localStyles.col_title}>FINANCIAL COLLABORATORS</div>

		<span className={localStyles.contribute}>How to contribue?</span>
	</div>
)

export default AcknowledgementContainer
