export default function delay(t: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, t))
}
