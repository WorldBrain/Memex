import React, { PureComponent } from 'react'

import analytics from 'src/analytics'
import localStyles from './Onboarding.css'

class Info extends PureComponent {
    trackWelcomeChoice = action => () =>
        analytics.trackEvent({
            category: 'Welcome page selection',
            action,
        })

    render() {
        return (
            <div className={localStyles.content}>
                <div className={localStyles.messageContainer}>
                    <div className={localStyles.message}>
                        <p className={localStyles.tip}>
                            <strong>Tip: </strong>Search directly from the
                            browser's address bar by typing:
                            <img
                                className={localStyles.logobig}
                                src="/img/shortcuts.png"
                            />
                        </p>
                        <a
                            className={localStyles.choiceBtn}
                            type="button"
                            href="/options/options.html#/tutorial"
                        >
                            See Full Tutorial
                        </a>
                    </div>
                </div>
            </div>
        )
    }
}

export default Info
