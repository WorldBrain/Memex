import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'

export default function PowerSearchBrowse({ onCloseRequested }) {
    return (
        <div>
            <NotificationLayout
                title={''}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
            >
                <div>
                    <div>
                        Memex makes every page you visit full-text searchable.
                    </div>
                    <div>
                        Type this shortcut into the address bar and search with
                        a term you see on this page
                    </div>
                    <div>
                        <div>M</div>
                        <div>then</div>
                        <div>Space</div>
                    </div>
                </div>
            </NotificationLayout>
        </div>
    )
}

PowerSearchBrowse['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
