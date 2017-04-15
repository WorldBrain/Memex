import React, { PropTypes } from 'react'

import BlacklistNewSite from '../blacklistNewSite'
import BlacklistRow from '../blacklistRow'
import styles from './style.css'

const Blacklist = ({
    blacklist, siteInputValue, onNewBlacklistItemAdded,
    onDeleteClicked, onInputChange, handleInputKeyPress,
}) => (
    <div>
        <div className={styles.toolbar}>
        </div>
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.domainCell}>Domain / Expression</th>
                        <th>Added</th>
                    </tr>
                </thead>

                <tbody>
                    <BlacklistNewSite onAdd={onNewBlacklistItemAdded}
                                    value={siteInputValue}
                                    handleKeyPress={handleInputKeyPress}
                                    onInputChange={onInputChange} />

                    { blacklist.map((item, idx) => (
                        <BlacklistRow blacklistItem={item}
                                    key={idx}
                                    itemId={idx}
                                    onDeleteClicked={onDeleteClicked} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)

Blacklist.propTypes = {
    blacklist: PropTypes.array.isRequired,
    siteInputValue: PropTypes.string.isRequired,
    onInputChange: PropTypes.func.isRequired,
    handleInputKeyPress: PropTypes.func.isRequired,
    onNewBlacklistItemAdded: PropTypes.func.isRequired,
    onDeleteClicked: PropTypes.func.isRequired,
}

export default Blacklist
