import * as React from 'react'

export class WithDependencies<Dependencies> extends React.Component<
    {
        setup: () => Promise<Dependencies>
        children: (dependencies: Dependencies) => React.ReactNode
    },
    { dependencies?: Dependencies }
> {
    state: { dependencies?: Dependencies } = {}

    async componentDidMount() {
        this.setState({ dependencies: await this.props.setup() })
    }

    render() {
        if (!this.state.dependencies) {
            return null
        }
        return this.props.children(this.state.dependencies)
    }
}
