import React, { PropTypes } from 'react'

import BlacklistNewSite from '../blacklistNewSite'
import BlacklistRow from '../blacklistRow'
import styles from './style.css'

const Blacklist = ({ blacklist, isAddingEnabled, onNewBlacklistItemAdded, onCancelAdding, onAddClicked, onDeleteClicked }) => {
    const inputName = 'addNewBlacklistItem'
    function handleAddClick() {
        onAddClicked()

        setTimeout(() => {
            const el = document.querySelector(`input[data-name="${inputName}"]`)
            el.focus()
        }, 100)
    }

    return (
        <div>
            <div className={styles.toolbar}>
                <button onClick={handleAddClick} className={styles.addButton}>Add</button>
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
                                        inputName={inputName}
                                        onAdd={onNewBlacklistItemAdded}
                                        onCancelAdding={onCancelAdding} />

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
}

Blacklist.propTypes = {
    blacklist: PropTypes.array.isRequired,
    isAddingEnabled: PropTypes.bool.isRequired,
    onNewBlacklistItemAdded: PropTypes.func.isRequired,
    onCancelAdding: PropTypes.func.isRequired,
    onAddClicked: PropTypes.func.isRequired,
    onDeleteClicked: PropTypes.func.isRequired
}

export default Blacklist
