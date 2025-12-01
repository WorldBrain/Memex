import React from 'react'
import PropTypes from 'prop-types'
import NotificationLayout from '../layout'

export default function OnboardingHighlightText({ onCloseRequested }) {
    return (
        <div>
            <NotificationLayout
                title={'STEP 1: Highlight some text'}
                onCloseRequested={onCloseRequested}
                thirdRowImage={null}
            >
                Just like you would normally do to copy/paste stuff.
            </NotificationLayout>
        </div>
    )
}

OnboardingHighlightText['propTypes'] = {
    onCloseRequested: PropTypes.func.isRequired,
}
