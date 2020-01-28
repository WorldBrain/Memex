export interface Descriptor {
    strategy: string
    content: any
}

export interface Anchor {
    quote: string
    descriptor: Descriptor
}

// TODO this seems to be a polymorphic type coming from the coffeescript anchoring, fill it in
export interface DOMSelector {
    descriptor: Descriptor
}

export interface Highlight {
    url: string
    anchors?: Anchor[]
    selector?: DOMSelector
}
