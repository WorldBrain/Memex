import * as React from 'react'
import cx from 'classnames'

const styles = require('./IndexDropdown.css')

export interface Props {
    value: any
}

class IndexDropdownUserRow extends React.PureComponent<Props> {
    render() {
        const { name, username, profilePic, isVerified } = this.props.value
        return (
            <div className={styles.socialContainer}>
                <div className={styles.userGroup}>
                    {profilePic && (
                        <img className={styles.avatar} src={profilePic} />
                    )}
                    <span className={styles.accountGroup}>
                        <span className={styles.fullName}>{name}</span>
                        {isVerified && (
                            <React.Fragment>
                                <span>&nbsp;</span>
                                <span className={styles.verified} />
                            </React.Fragment>
                        )}
                        <span>&nbsp;</span>
                        <span className={styles.username}>@{username}</span>
                    </span>
                </div>
            </div>
        )
    }
}

export default IndexDropdownUserRow
