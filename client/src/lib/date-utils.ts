import { format, parseISO, isValid } from "date-fns";

export const formatDisplayDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Recent";
  
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : "Recent";
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Recent";
  }
};
