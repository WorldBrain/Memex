import React from 'react'
import PropTypes from 'prop-types'
import Styles from './provider-list.css'

export function ProviderList({ onChange }) {
    return (
        <div>
            <p className={Styles.subTitle}>Currently Available</p>
            <form>
                <label>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('google-drive')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <img
                            className={Styles.logo}
                            src={'img/google-drive.png'}
                        />
                        <span className={Styles.name}>Google Drive</span>
                    </span>
                </label>
                <br />
                <label>
                    <input
                        type="radio"
                        name="backend-select"
                        onChange={() => onChange('local')}
                    />
                    <span style={{ cursor: 'pointer' }}>
                        <span className={Styles.title}>Local Backup</span>
                        <p className={Styles.description}>
                            Backup your data locally, or to any cloud provider
                            that has a syncing folder on your
                            <br />
                            computer (e.g. Dropbox, Spideroak, GDrive)
                        </p>
                    </span>
                </label>
                <br />
            </form>
            <p className={Styles.subTitle}>Future Options</p>
            <div className={Styles.voteContainer}>
                <a
                    className={Styles.vote}
                    target="blank"
                    href="https://goo.gl/forms/Lh5pPWc75r7ds2m63"
                >
                    Vote
                </a>
                <span>on your favorite provider</span>
            </div>
            <input type="radio" disabled />
            <span className={Styles.disabled}>Own Cloud</span>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>Self hosting</span>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>Own Cloud</span>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>Dropbox</span>
            <br />
            <input type="radio" disabled />
            <span className={Styles.disabled}>AWS</span>
            <br />
        </div>
    )
}

ProviderList.propTypes = {
    onChange: PropTypes.func.isRequired,
}
