import React, { PureComponent } from 'react'
import { Link } from 'react-router'

import ResultsMessage from './ResultsMessage'

const styles = require('./ResultsMessage.css')

class InitResultsMessage extends PureComponent {
    render() {
        return (
            <ResultsMessage>
                <div className={styles.title}>
                    Nothing to search yet. <br />
                    <div className={styles.subTitle}>
                        <a
                            target="_blank"
                            href="http://memex.link/S1zVMgKzX/en.wikipedia.org/wiki/Memex"
                        >
                            Visit
                        </a>{' '}
                        a website, <a href="/options.html#/import">import</a>{' '}
                        your existing history or{' '}
                        <a href="/options.html#/tutorial">read</a> the tutorial.
                    </div>
                </div>
            </ResultsMessage>
        )
    }
}

export default InitResultsMessage
