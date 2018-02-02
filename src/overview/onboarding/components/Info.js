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
                        <p>
                            With a 15s delay, Memex stores the content of the
                            websites you visit.<br />Titles and URLs are always
                            searchable.
                        </p>
                        <p>
                            <strong>Pro Tip: </strong>Search directly from the
                            address bar by typing:
                            <img
                                className={localStyles.logobig}
                                src="/img/shortcuts.png"
                            />
                        </p>
                    </div>
                </div>
                <div className={localStyles.message}>More Guidance</div>
                <div className={localStyles.btnBar}>
                    <a
                        className={localStyles.btnLink}
                        onClick={this.trackWelcomeChoice('Tutorial video')}
                        type="button"
                        href="https://worldbrain.io/tutorial"
                        target="_blank"
                    >
                        <strong>Watch</strong> 90s Tutorial Video
                    </a>

                    <a
                        className={localStyles.btnLink}
                        onClick={this.trackWelcomeChoice('Tutorial page')}
                        type="button"
                        href="/options/options.html#/tutorial"
                        target="_blank"
                    >
                        <strong>Read</strong> Step-By Step Tutorial
                    </a>
                </div>
            </div>
        )
    }
}

export default Info
