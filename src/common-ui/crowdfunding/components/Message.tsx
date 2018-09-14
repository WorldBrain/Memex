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
        <p className={styles.header}>Fund the future!</p>
        <p className={styles.bolderText}>
            Unfortunately you can't share <br /> and discuss {props.context}{' '}
            yet.
        </p>
        <p className={styles.text}>
            Support the development with 10€ and <br />
            <b>get back 30€</b> worth of Memex Premium Credits.
        </p>
        <a className={styles.learnMore} onClick={props.openNewLink}>
            LEARN MORE
        </a>
    </React.Fragment>
)

export default message
