export interface Page {
    url: string | null
    title: string | null
}

export type ClickHandler<T extends HTMLElement> = (
    e: React.SyntheticEvent<T>,
) => void
