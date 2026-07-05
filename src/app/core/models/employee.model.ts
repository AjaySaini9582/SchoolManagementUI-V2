import { UploadDocument } from './shared.model';

export interface Employee {
  id: number;
  name: string;
  releativeName: string | null;
  genderId: number | null;
  dob: string | null;
  roleId: number;
  contactNumber: string | null;
  emergencyContactNumber: string | null;
  email: string | null;
  qualification: string | null;
  bloodGroupId: number | null;
  joiningDate: string | null;
  anniversaryDate: string | null;
  address: string | null;
  departmentId: number | null;
  designationId: number | null;
  classId: number | null;
  sectionId: number | null;
  bankId: number | null;
  houseId: number | null;
  accountNumber: string | null;
  ifscCode: string | null;
  adharNumber: string | null;
  panNumber: string | null;
  expercience: string | null;
  salary: number | null;
  uploadDocument: UploadDocument[] | null;
  generatedUserName: string | null;
  generatedPassword: string | null;
}

export interface EmployeeStoreProcedure {
  id: number;
  name: string | null;
  mobileNumber: string | null;
  dob: string | null;
  email: string | null;
  departmentId: number | null;
  designationId: number | null;
  qualification: string | null;
  salary: number | null;
  address: string | null;
  assignedClass: string | null;
  photo: string | null;
  isActive: boolean;
  totalCount: number;
}
