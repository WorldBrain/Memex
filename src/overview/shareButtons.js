import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styles from './components/Overview.css'

class ShareButtons extends Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div
                className={styles.shareIcons}
                style={{
                    right: 0,
                    top: 150,
                }}
            >
                <p
                    style={{
                        fontSize: 10,
                        color: '#00b38f',
                    }}
                >
                    {' '}
                    Spread the love{' '}
                </p>{' '}
                <a href="#">
                    {' '}
                    <img width={25} height={25} src="/img/face.png" />{' '}
                </a>{' '}
                <a href="#">
                    {' '}
                    <img width={25} height={25} src="/img/twitt.png" />{' '}
                </a>{' '}
                <a href="#">
                    {' '}
                    <img width={25} height={25} src="/img/@.png" />{' '}
                </a>{' '}
                <a href="#">
                    {' '}
                    <img width={25} height={25} src="/img/ic.png" />{' '}
                </a>{' '}
                <div id={styles.fedIcon}>
                    <a
                        href="#"
                        style={{
                            textDecoration: 'none',
                            color: '#ffffff',
                            backgroundColor: '#00b38f',
                            borderStyle: 'solid',
                            borderColor: '#00b38f',
                            borderLeftWidth: 10,
                            borderRightWidth: 10,
                            borderTopWidth: 10,
                            borderBottomWidth: 10,
                        }}
                    >
                        {' '}
                        FEEDBACK{' '}
                    </a>{' '}
                </div>{' '}
            </div>
        )
    }
}

export default ShareButtons
