import React from 'react'

import localStyles from './styles.css'

const PrivacyContainer = () => (
    <div className={localStyles.privacy}>
        <span className={localStyles.title}>
            {' '}
            Your privacy & data-ownership is most important to us.
        </span>

        <div className={localStyles.content}>
            All your data is stored locally on your computer.
            <br />Noone will EVER have access to it by default.
            <br />
            <br />You will be able to <strong>voluntarily</strong> share it in
            later stages with friends, followers and other applications. For
            more information on that you can watch our{' '}
            <a className={localStyles.link} href="https://worldbrain.io/vision">
                vision video
            </a>.
        </div>
    </div>
)

export default PrivacyContainer
