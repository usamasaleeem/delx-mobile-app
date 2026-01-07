export function getFormattedDateTime() {
  const d = new Date();

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  let minutes = String(d.getMinutes()).padStart(2, "0");

  // Convert 24h → 12h (optional)
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes} ${ampm}`
  };
}