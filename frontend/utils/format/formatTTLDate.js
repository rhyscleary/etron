
export default function formatTTLDate(ttl) {
    const date = new Date(ttl * 1000);
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
    })
}