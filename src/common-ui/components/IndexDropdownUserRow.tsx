import * as React from 'react'

export interface Props {
    value: any
}

class IndexDropdownUserRow extends React.PureComponent<Props> {
    render() {
        const { name, username, profilePic, isVerified } = this.props.value
        return (
            <div>
                <div>
                    {profilePic && <img src={profilePic} />}
                    <div>
                        <span>
                            <span>{name}</span>
                            {isVerified && (
                                <React.Fragment>
                                    <span />
                                </React.Fragment>
                            )}
                        </span>
                        <span>@{username}</span>
                    </div>
                </div>
            </div>
        )
    }
}

export default IndexDropdownUserRow
