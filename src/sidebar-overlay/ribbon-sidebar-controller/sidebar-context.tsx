import React from 'react'
import { SidebarContextInterface } from 'src/sidebar-overlay/types'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'
type Optionalize<T extends K, K> = Omit<T, keyof K>
interface Props extends SidebarContextInterface {
    children?: React.ReactNode
    innerRef?: any
}
const highlighter = new HighlightInteraction()
export function withSidebarContext<
    T extends SidebarContextInterface = SidebarContextInterface
>(WrappedComponent: any) {
    // FIXME: (ch - annotations) should be something like React.ComponentType<Optionalize<T, Props>> but causes issues with ref
    // Try to create a nice displayName for React Dev Tools.
    const displayName =
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'ComponentwithSidebarContext'

    return class ComponentWithSidebarContext extends React.Component<
        any // FIXME: (ch - annotations)  should be something like Optionalize<T, Props> but causes issues with ref
    > {
        public static displayName = `withSidebarContext(${displayName})`

        public render() {
            // @ts-ignore
            const { innerRef, ...rest } = this.props
            return (
                <WrappedComponent
                    ref={innerRef}
                    highlighter={highlighter}
                    {...(rest as T)}
                />
            )
        }
    }
}
