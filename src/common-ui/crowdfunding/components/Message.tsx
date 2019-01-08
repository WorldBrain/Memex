import React from 'react'

interface Styles {
    [propName: string]: string
}

interface Props {
    styles: Styles
    context: string
    openNewLink: () => Promise<void>
}

const message: React.SFC<Props> = ({ styles, ...props }) => (
    <React.Fragment>
        <p className={styles.header}>Feature not available yet</p>
        <p className={styles.bolderText}>
            Preoder today for 75% off plus get free access to the invite-only
            Preview Release.
        </p>
        <a className={styles.learnMore} onClick={props.openNewLink}>
            LEARN MORE
        </a>
    </React.Fragment>
)

export default message
