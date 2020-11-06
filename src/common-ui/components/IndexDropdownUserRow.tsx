import * as React from 'react'

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
                    <div className={styles.accountGroup}>
                        <span className={styles.fullName}>
                            <span>{name}</span>
                            {isVerified && (
                                <React.Fragment>
                                    <span className={styles.verified} />
                                </React.Fragment>
                            )}
                        </span>
                        <span className={styles.username}>@{username}</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default IndexDropdownUserRow
