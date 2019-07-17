import * as React from 'react'
import * as constants from 'src/sidebar-overlay/comment-box/constants'

interface ChildProps {
    // children: ReactChild
}
type Props = ChildProps
export default class TextAreaDynamicRows extends React.Component<
    Props,
    { rows: number }
> {
    private ref: HTMLTextAreaElement

    constructor(props) {
        super(props)
        this.state = { rows: constants.NUM_DEFAULT_ROWS }
    }

    // -- Methods primarily to do with keeping the selection state in sync --
    componentDidMount() {
        this.ref.addEventListener('onChange', this.handleRows)
    }

    componentWillUnmount() {
        this.ref.addEventListener('onChange', this.handleRows)
    }

    private handleRows() {
        const rows =
            this.ref.value.length === 0
                ? constants.NUM_DEFAULT_ROWS
                : Math.max(this.state.rows, constants.NUM_MIN_ROWS)

        if (rows !== this.state.rows) {
            this.setState({ rows })
        }
    }

    private onChange = () => {
        this.handleRows()
    }

    private updateRef = e => (this.ref = e)

    render() {
        return React.cloneElement(this.props.children[0], {
            updateRef: this.updateRef,
            rows: this.state.rows,
        })
    }
}
