// Column definitions for the bulk-upload Excel template and the importer.
// Plain data (no server-only APIs) so it can be shared anywhere.

export const EMPLOYEE_COLUMNS = [
  { header: "Name", field: "name", example: "Farhana Rahman", example2: "Tanvir Ahmed" },
  { header: "Gender", field: "gender", example: "female", example2: "male" },
  { header: "Employee ID", field: "employeeCode", example: "IW-0042", example2: "IW-0043" },
  { header: "Designation", field: "designation", example: "Software Engineer", example2: "Sales Manager" },
  { header: "Department", field: "department", example: "Engineering", example2: "Sales" },
  { header: "Employment Type", field: "employmentType", example: "Permanent, full-time", example2: "Contractual" },
  { header: "Joining Date", field: "joiningDate", example: "2023-02-01", example2: "2021-08-15" },
  { header: "Last Working Date", field: "lastWorkingDate", example: "", example2: "2026-03-31" },
  { header: "Salary", field: "salary", example: "85000", example2: "120000" },
  { header: "Status", field: "status", example: "Present", example2: "Resigned" },
  { header: "Email", field: "email", example: "farhana@example.com", example2: "tanvir@example.com" },
  { header: "Phone", field: "phone", example: "01700000000", example2: "01800000000" },
  { header: "Address", field: "address", example: "Rajshahi, Bangladesh", example2: "Dhaka, Bangladesh" },
  // Personal bank account
  { header: "Personal Account Holder", field: "personalAccountHolder", example: "Farhana Rahman", example2: "Tanvir Ahmed" },
  { header: "Personal Account Number", field: "personalAccountNumber", example: "1234567890", example2: "9876543210" },
  { header: "Personal Bank Name", field: "personalBankName", example: "BRAC Bank", example2: "City Bank" },
  { header: "Personal Routing Number", field: "personalRoutingNumber", example: "060270247", example2: "225261736" },
  { header: "Personal Branch Name", field: "personalBranchName", example: "Rajshahi Branch", example2: "Gulshan Branch" },
  { header: "Personal Bank City", field: "personalBankCity", example: "Rajshahi", example2: "Dhaka" },
  { header: "Personal Swift Code", field: "personalSwiftCode", example: "BRAKBDDH", example2: "CIBLBDDH" },
  { header: "Personal Bank Contact Number", field: "personalBankContact", example: "+8809612345678", example2: "+8809612348888" },
  // Payroll bank account
  { header: "Payroll Account Holder", field: "payrollAccountHolder", example: "Inteliweave", example2: "Inteliweave" },
  { header: "Payroll Account Number", field: "payrollAccountNumber", example: "1112223334", example2: "1112223334" },
];

const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

// Map a spreadsheet header (or a few friendly aliases) to an employee field.
const HEADER_TO_FIELD = (() => {
  const map = {};
  for (const c of EMPLOYEE_COLUMNS) {
    map[norm(c.header)] = c.field;
    map[norm(c.field)] = c.field;
  }
  // Aliases people commonly type
  map[norm("Employee Code")] = "employeeCode";
  map[norm("ID")] = "employeeCode";
  map[norm("Role")] = "designation";
  map[norm("Title")] = "designation";
  map[norm("Dept")] = "department";
  map[norm("Joining")] = "joiningDate";
  map[norm("Date of Joining")] = "joiningDate";
  map[norm("Last Day")] = "lastWorkingDate";
  map[norm("Employment")] = "employmentType";
  map[norm("Mobile")] = "phone";
  return map;
})();

export function resolveField(header) {
  return HEADER_TO_FIELD[norm(header)] || null;
}
