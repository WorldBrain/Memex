export function isTermsField(params: {
    collection: string
    field: string
}): boolean {
    return (
        params.field.startsWith('_terms') ||
        params.field.endsWith('Terms') ||
        params.field === 'terms'
    )
}
