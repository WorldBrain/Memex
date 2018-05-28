import React from 'react'
import { Link } from 'react-router'
import PropTypes from 'prop-types'

import { OutLink } from 'src/common-ui/containers'
import localStyles from './Privacy.css'

const Privacy = props => (
    <div className={localStyles.privacy}>
        <span className={localStyles.title}>
            {' '}
            Your privacy & data-ownership is most important to us.
        </span>

        <div className={localStyles.content}>
            <h3>Your personal data is yours</h3>
            All your personal data is stored locally on your computer.
            <br />Noone will EVER have access to it by default.
            <br />
            <br />Later, you will be able to <strong>voluntarily</strong> share
            it with friends, followers and other applications. For more
            information on that you can watch our{' '}
            <OutLink
                className={localStyles.link}
                to="https://worldbrain.io/vision"
            >
                vision video
            </OutLink>.
            <br />
            <br />
            <h3>Anonymous Usage Statistics</h3>
            WorldBrain.io may collect crash reports and anonymous statistics
            about how users use our website, the Memex software and its
            features.<br />
            This data will <strong>not contain any personal data</strong> (e.g.
            terms you search, the urls you visit/bookmark or the pages you
            blacklist)<br />
            The data is solely used to improve Memex stability, usability and
            features, and is not shared with any 3rd party. <br />
            <Link className={localStyles.link} to="/statistics">
                Here
            </Link>{' '}
            is a complete list of all the data points Memex gathers currently.
            To cross-check this list you can examine our source code{' '}
            <OutLink
                className={localStyles.link}
                to="https://github.com/WorldBrain/Memex"
            >
                on GitHub
            </OutLink>. To protect your privacy, we don't use Google Analytics.
            Instead we use{' '}
            <OutLink className={localStyles.link} to="https://WorldBrain.io/">
                Piwik
            </OutLink>, an open-source alternative, and host the gathered data
            on our servers.
            <br />
            <br />
            <h3>Opting-out of Usage Statistics</h3>
            We respect your wish of opting out either through the
            "do-not-track"-feature of the browser or by manually selecting an
            option below.
            <br />
            <br />Do you want to share anonymous usage statistics, so we can
            improve the Memex for you and others?
            <select
                value={props.shouldTrack ? 'y' : 'n'}
                onChange={props.handleTrackChange}
            >
                <option value="y">Yes</option>
                <option value="n">No</option>
            </select>
            <br />
            <br />
            <h3>Privacy Policy Changes</h3>
            Although most changes are likely to be minor, WorldBrain.io may
            change its Privacy Policy from time to time, and in WorldBrain.io’s
            sole discretion. WorldBrain.io encourages visitors to frequently
            check this page for any changes to its Privacy Policy. Your
            continued use of this site after any change in this Privacy Policy
            will constitute your acceptance of such change.
            <br />
            Date of last change: 26.11.17
            <br />
            <br />
            <h3>Protection of Certain Personally-Identifying Information</h3>
            WorldBrain.io will not rent or sell any of the gathered statistical,
            potentially personally-identifying and personally-identifying
            information to anyone. If you are a registered user of a
            WorldBrain.io newsletter and have supplied your email address,
            WorldBrain.io may occasionally send you an email to tell you about
            new features, solicit your feedback, or just keep you up to date
            with what’s going on with WorldBrain.io and our products. We
            primarily use our blog to communicate this type of information, so
            we expect to keep this type of email to a minimum. WorldBrain.io
            takes all measures reasonably necessary to protect against the
            unauthorized access, use, alteration, or destruction of potentially
            personally-identifying and personally-identifying information.
            <br />
            <br />
            <h3>Scope of Privacy Policy</h3>
            This Privacy Policy applies to the information that we obtain
            through your use of WorldBrain.io services via a device or when you
            otherwise interact with WorldBrain.io, Memex and WorldBrain UG.
            WorldBrain.io services include our:
            <ul>
                <li>Websites (worldbrain.io and subdomains *.worldbrain.io)</li>
                <li>Downloadable Products (Memex Browser Extensions).</li>
            </ul>
        </div>
    </div>
)

Privacy.propTypes = {
    shouldTrack: PropTypes.bool.isRequired,
    handleTrackChange: PropTypes.func.isRequired,
}

export default Privacy
