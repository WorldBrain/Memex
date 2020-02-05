import React from 'react'
import { SidebarContextInterface } from 'src/sidebar-overlay/types'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'

type Optionalize<T extends K, K> = Omit<T, keyof K>

const highlighter = new HighlightInteraction()

export function withSidebarContext<
    T extends SidebarContextInterface = SidebarContextInterface
>(WrappedComponent: React.ComponentType<T>) {
    const displayName =
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'ComponentwithSidebarContext'

    return class ComponentWithSidebarContext extends React.Component<
        Optionalize<T, SidebarContextInterface> & { innerRef?: any }
    > {
        public static displayName = `withSidebarContext(${displayName})`

        public render() {
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
