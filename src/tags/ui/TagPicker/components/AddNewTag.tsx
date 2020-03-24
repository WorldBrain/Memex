import React from 'react'

interface Props {
    onPress: () => void
    tag: string
}

export default (props: Props) => {
    return <div onClick={props.onPress}> Create: {props.tag}</div>
}
