import React, { PropTypes } from 'react'

import BlacklistNewSite from '../blacklistNewSite'
import BlacklistRow from '../blacklistRow'
import styles from './style.css'

const Blacklist = ({
    blacklist, siteInputValue, isAddingEnabled, onNewBlacklistItemAdded,
    onCancelAdding, onAddClicked, onDeleteClicked, onInputChange,
}) => {
    return (
        <div>
            <div className={styles.toolbar}>
                <button onClick={onAddClicked} className={styles.addButton}>Add</button>
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
                        <BlacklistNewSite isEnabled={isAddingEnabled}
                                        onAdd={onNewBlacklistItemAdded}
                                        onCancelAdding={onCancelAdding}
                                        value={siteInputValue}
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
    );
}

Blacklist.propTypes = {
    blacklist: PropTypes.array.isRequired,
    siteInputValue: PropTypes.string.isRequired,
    isAddingEnabled: PropTypes.bool.isRequired,
    onInputChange: PropTypes.func.isRequired,
    onNewBlacklistItemAdded: PropTypes.func.isRequired,
    onCancelAdding: PropTypes.func.isRequired,
    onAddClicked: PropTypes.func.isRequired,
    onDeleteClicked: PropTypes.func.isRequired
}

export default Blacklist
