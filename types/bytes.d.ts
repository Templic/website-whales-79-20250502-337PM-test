declare module 'bytes' {
  /**
   * Convert byte sizes to human readable format
   */
  function format(bytes: number): string;

  /**
   * Parse a string byte value into a number
   */
  function parse(val: string): number;
}