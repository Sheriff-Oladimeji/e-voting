export function hasRole(
  user: { role: string } | null | undefined,
  role: "admin" | "student"
): boolean {
  return user?.role === role;
}
