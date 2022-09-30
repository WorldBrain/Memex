export default function delay(t: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, t))
}
