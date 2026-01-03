/**
 * Generates employee login ID in format: [CompanyPrefix][FirstTwoLettersFirstName][FirstTwoLettersLastName][Year][SerialNumber]
 * Example: OIJODO20220001
 * OI → Company Name prefix
 * JODO → First two letters of first name + last name
 * 2022 → Year of Joining
 * 0001 → Serial Number of Joining for that Year
 */
export function generateEmployeeLoginId(
  companyName: string,
  firstName: string,
  lastName: string,
  year: number,
  serialNumber: number
): string {
  const companyPrefix = companyName.substring(0, 2).toUpperCase();
  const firstNamePrefix = firstName.substring(0, 2).toUpperCase();
  const lastNamePrefix = lastName.substring(0, 2).toUpperCase();
  const serial = serialNumber.toString().padStart(4, "0");

  return `${companyPrefix}${firstNamePrefix}${lastNamePrefix}${year}${serial}`;
}

/**
 * Generates a random password for new employees
 */
export function generateRandomPassword(length: number = 12): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
