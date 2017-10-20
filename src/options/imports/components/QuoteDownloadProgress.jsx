import React from 'react'

import localStyles from './Import.css'

const QuoteDownloadProgress = () => (
    <div className={localStyles.quoteBlock}>
        <span className={localStyles.quoteLine}>
            &quot;Don't trust quotes from the internet.&quot;
        </span>
        <br />
        Abraham Lincoln
    </div>
)

export default QuoteDownloadProgress
