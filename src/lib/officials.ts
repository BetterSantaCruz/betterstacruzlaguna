export function isMunicipalMayor(role?: string): boolean {
  const normalizedRole = role?.trim().toLowerCase();
  return normalizedRole === 'mayor' || normalizedRole === 'municipal mayor';
}
