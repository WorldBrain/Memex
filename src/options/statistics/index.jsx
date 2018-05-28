import React from 'react'

import { OutLink } from 'src/common-ui/containers'
import localStyles from './styles.css'

const Privacy = () => (
    <div className={localStyles.privacy}>
        <span className={localStyles.title}>
            {' '}
            Detailed list of usage statistics
        </span>
        <div className={localStyles.content}>
            <p>
                We will soon also make the statistics available for you to view
                here. If you have questions around these statistics, we invite
                you to{' '}
                <a
                    className={localStyles.link}
                    href="mailto:info@worldbrain.io"
                >
                    write us an email
                </a>, or post them to{' '}
                <OutLink
                    className={localStyles.link}
                    to="https://worldbrain.io/faq"
                >
                    our FAQs
                </OutLink>.
            </p>

            <h3>General Metrics</h3>
            <ul>
                <li>Active user yes/no?</li>
                <li>Time since install</li>
                <li># of urls in DB</li>
                <li>Country</li>
                <li>Error Logs in case of crashes</li>
                <li>Browser type</li>
            </ul>
            <h3>Onboarding</h3>
            <ul>
                <li>Time spent on Welcome page</li>
                <li>
                    Selection picked on Welcome Page (Watching tutorial, Reading
                    Tutorial, Go Browsing
                </li>
            </ul>
            <h3>Searching</h3>
            <ul>
                <li># of searches per week</li>
                <li># of failed & successful searches per week</li>
                <li>% of search in addressbar vs. popup vs. overview</li>
                <li># of bookmark searches</li>
                <li># of NLP queries vs. date picker</li>
                <li># of uses for pagination</li>
            </ul>
            <h3>Importing</h3>
            <ul>
                <li>Concurrency levels</li>
                <li>Use of bookmarks import</li>
                <li>Use of history import</li>
                <li># of imports started</li>
            </ul>
            <h3>Features</h3>
            <ul>
                <li># of uses for bookmarking feature in overview vs. popup</li>
                <li>
                    # of uses for blacklisting feature in popup vs. in options
                    page
                </li>
                <li># of uses for popup in general</li>
                <li># of deletion events</li>
                <li># of uses of share buttons</li>
            </ul>
            <br />
            <br />
        </div>
    </div>
)

export default Privacy
