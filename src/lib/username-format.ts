// Matric numbers look like "2022/409799" — Better Auth's default username
// validator (letters/digits/underscore/dot only) rejects the "/" separator.
export const USERNAME_PATTERN = /^[a-zA-Z0-9/_.-]+$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}
