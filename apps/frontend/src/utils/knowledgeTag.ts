/** Knowledge-base tag names are capped so list columns stay readable. */
export const TAG_NAME_MAX_LENGTH = 10

export function isTagNameTooLong(name: string): boolean {
  return Array.from(name.trim()).length > TAG_NAME_MAX_LENGTH
}
