import React, { Component } from 'react'
import db from './index-pouch.js'
import styles from './style.css'


class NotificationsContainer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            doc: {
                _id: '',
                name: '',
                occupation: '',
                age: null,

            },
        }
    }

    componentDidMount() {
        db.get('mittens1')
            .then(doc => this.setState(() => ({ doc })))
            .catch(err => console.log(err))
    }

    render() {
        const {_id, name, occupation, age} = this.state.doc
        return (
            <div className='recipes'>
                <h1>id {_id}</h1>
                <p>
                    <span>{name} nameç | </span>
                    <span>{occupation} occupation | </span>
                    <span>{age} age | </span>
                </p>
            </div>
        )
    }
}

export default NotificationsContainer
