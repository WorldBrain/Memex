import React from 'react'
import PropTypes from 'prop-types'

import { ANALYTICS_EVENTS } from 'src/analytics/constants'
import { OutLink } from 'src/common-ui/containers'
const localStyles = require('./Privacy.css')
const settingsStyle = require('src/options/settings/components/settings.css')

const Privacy = props => (
    <div className={localStyles.privacy}>
        <div className={settingsStyle.section}>
            <div className={settingsStyle.sectionTitle}>
                {' '}
                Your privacy & data-ownership is core to our mission.
            </div>
            <p className={settingsStyle.subSubTitle}>
                Your personal data is yours
            </p>
            <p className={settingsStyle.infoText}>
                All your personal data is stored locally on your computer.
                <br />
                Unless you share it, or back it up to one of your cloud
                services, noone will ever have access to it by default.
                <br />
                <br />
                See a more detailed version of our{' '}
                <OutLink
                    className={localStyles.link}
                    to="https://worldbrain.io/privacy"
                >
                    privacy policy
                </OutLink>{' '}
                including some common questions answered.
                <br />
            </p>
        </div>

        <div className={settingsStyle.section}>
            <div className={settingsStyle.sectionTitle}>
                Opt-Out from Usage Statistics
            </div>
            <p className={settingsStyle.infoText}>
                We only collect statistical data about used features to improve
                the user flows and know which features to build next or improve.
                We NEVER have access to your personal data, like terms you
                search, tags or notes you make.
            </p>
            <div className={localStyles.optOut}>
                <span className={settingsStyle.infoText}>
                    Do you want to share anonymous usage statistics?
                </span>
                <select
                    value={props.shouldTrack ? 'y' : 'n'}
                    onChange={props.handleTrackChange}
                >
                    <option value="y">Yes</option>
                    <option value="n">No</option>
                </select>
            </div>
        </div>

        <div className={settingsStyle.section}>
            <div className={settingsStyle.sectionTitle}>
                Detailed list of all tracked events
            </div>
            <p className={settingsStyle.infoText}>
                These are all the events that Memex collects. 
                None of them contain personal data like the websites you visit, tags or content of annotations, or data that allows us to identify who those events came from. 
            </p>
            
                <div>
                        <table className={localStyles.eventTable}>
                          <tr className={localStyles.tableTitle}>
                            <th>Event Name</th>
                            <th>Description</th>
                          </tr>
                              {Object.entries(ANALYTICS_EVENTS).map(([categoryName, actions]) => (
                                
                                Object.entries(actions).map(([actionName, actionInfo]) => (
                                    <tr
                                        className={localStyles.eventRow}
                                    >
                                            <td 
                                                key={`${categoryName}::${actionName}`}
                                                className={localStyles.eventName}
                                            >
                                                {categoryName}::{actionName}
                                            </td>
                                            <td
                                                className={localStyles.actionDescription}
                                                key={`${actionInfo.description}`}
                                            >{actionInfo.description}</td>
                                    </tr>
                                ))
                                ))}
                        </table>
                </div>
        </div>
    </div>
)

Privacy.propTypes = {
    shouldTrack: PropTypes.bool.isRequired,
    handleTrackChange: PropTypes.func.isRequired,
}

export default Privacy
