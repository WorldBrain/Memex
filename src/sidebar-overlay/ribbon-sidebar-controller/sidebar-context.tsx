import React from 'react'
import { SidebarContext } from 'src/sidebar-overlay'
import { SidebarContextInterface } from 'src/sidebar-overlay/types'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'
type Optionalize<T extends K, K> = Omit<T, keyof K>
interface Props extends SidebarContextInterface {
    children: React.ReactNode
}
const highlighter = new HighlightInteraction()
export function withSidebarContext<
    T extends SidebarContextInterface = SidebarContextInterface
>(WrappedComponent: React.ComponentType<T>) {
    // Try to create a nice displayName for React Dev Tools.
    const displayName =
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'ComponentwithSidebarContext'

    return class ComponentWithTheme extends React.Component<
        Optionalize<T, SidebarContextInterface>
    > {
        public static displayName = `withSidebarContext(${displayName})`

        public render() {
            return (
                <WrappedComponent
                    highlighter={highlighter}
                    {...(this.props as T)}
                />
            )
        }
    }
}
