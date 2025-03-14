import { format, parseISO, isValid } from "date-fns";

export const formatDisplayDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : "Invalid date";
  } catch (e) {
    return "Invalid date";
  }
};
