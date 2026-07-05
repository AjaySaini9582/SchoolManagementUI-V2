/** `MasterController.GetMasterKeyData`'s "key groups" — there's no backend
 * enum, just integer literals seeded into `Tb_Master_Keys`/`Tb_Master_Key_Data`.
 * Confirmed via the EF migration seed data; if the school ever adds a new
 * master-key category, add it here too. */
export const MASTER_KEY = {
  Gender: 1,
  BloodGroup: 2,
  BankAccountType: 3,
  MediumType: 4,
  AdmissionScheme: 5,
  AdmissionType: 6,
  Religion: 7,
  AttendanceStatus: 8,
} as const;

export interface MasterKeyDataValue {
  keyId: number | null;
  id: number;
  text: string | null;
}
