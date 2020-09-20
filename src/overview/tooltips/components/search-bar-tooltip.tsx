import React from 'react'

const styles = require('./tooltip.css')

/**
 * React component which gets rendered for 'search-bar' tooltip
 * in overview.
 */
const searchBarTooltip: React.SFC = () => (
    <div>
		<p className={styles.title}>		    	
		Search with any word you remember about websites you saved.  
		</p>
		<p className={styles.subInfo}>		
			<span><b>🤓 Pro Tip: </b> Import your existing bookmarks.</span>
			<a target="_blank" href="#import"><span className={styles.start}>Do it!</span></a>
		</p>
    </div>
)

export default searchBarTooltip
