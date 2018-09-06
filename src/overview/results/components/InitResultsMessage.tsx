import React, { PureComponent } from 'react'
import { Link } from 'react-router'

import ResultsMessage from './ResultsMessage'

const styles = require('./ResultsMessage.css')

class InitResultsMessage extends PureComponent {
    render() {
        return (
            <ResultsMessage>
                <div className={styles.title}>
                    You didn't visit or{' '}
                    <Link style={{ color: '#777' }} to="/import">
                        import
                    </Link>
                    <br />
                    any websites yet.
                </div>
                <div>
                    <Link
                        className={styles.choiceBtn}
                        type="button"
                        to="/import"
                    >
                        Import History & Bookmarks
                    </Link>
                </div>
            </ResultsMessage>
        )
    }
}

export default InitResultsMessage
