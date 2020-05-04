import React from 'react'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'

const highlighter = new HighlightInteraction()

type WithInnerRef<T> = T & { innerRef?: any }

export function withSidebarContext<TProps>(
    WrappedComponent: React.ComponentType<TProps>,
) {
    const displayName =
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'ComponentwithSidebarContext'

    return class ComponentWithSidebarContext extends React.Component<
        WithInnerRef<Omit<TProps, 'highlighter'>>
    > {
        public static displayName = `withSidebarContext(${displayName})`

        public render() {
            const { innerRef, ...rest } = this.props
            return (
                <WrappedComponent
                    {...(rest as TProps)}
                    ref={innerRef}
                    highlighter={highlighter}
                />
            )
        }
    }
}
