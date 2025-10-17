export default function formatDateTime(
	isoString,
	{
		locale,
		timeZone,
		includeSeconds = false,
		hour12,
		showTZ = true,
	} = {}
) {
	if (!isoString) return "";

	const date = new Date(isoString);
	const options = {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		...(includeSeconds ? { second: "2-digit" } : null),
		...(hour12 !== undefined ? { hour12 } : null),
		...(timeZone ? { timeZone } : null),
		...(showTZ ? { timeZoneName: "short" } : null),
	};

	try {
		return new Intl.DateTimeFormat(locale, options).format(date);
	} catch {
		return isoString.replace("T", " ").replace("Z", " UTC");
	}
}