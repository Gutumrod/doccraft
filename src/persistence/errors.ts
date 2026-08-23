import type { PersistenceError, PersistenceErrorCode } from './types';

export function createPersistenceError(
  code: PersistenceErrorCode,
  message: string,
  details?: unknown
): PersistenceError {
  return {
    code,
    message,
    details,
  };
}

export const PERSISTENCE_ERROR_MESSAGES: Record<PersistenceErrorCode, string> = {
  STORAGE_UNAVAILABLE: 'เบราว์เซอร์ไม่รองรับหรือไม่เปิดใช้งานพื้นที่จัดเก็บข้อมูล (LocalStorage)',
  STORAGE_QUOTA_EXCEEDED: 'พื้นที่จัดเก็บข้อมูลในเบราว์เซอร์เต็ม (Storage Quota Exceeded)',
  STORAGE_WRITE_FAILED: 'ไม่สามารถบันทึกข้อมูลลงในเบราว์เซอร์ได้',
  CORRUPTED_PAYLOAD: 'โครงสร้างไฟล์ JSON ไม่ถูกต้องหรือเสียหาย',
  UNSUPPORTED_SCHEMA_VERSION: 'เวอร์ชันของเอกสารไม่ได้รับการรองรับหรือไม่สามารถแปลงข้อมูลได้',
  INVALID_DOCUMENT_STRUCTURE: 'ข้อมูลในเอกสารไม่ตรงตามข้อกำหนดของระบบ DocCraft',
  ENVELOPE_VALIDATION_FAILED: 'โครงสร้าง Envelope หรือความสอดคล้องของ Schema Version ไม่ถูกต้อง',
  DOMAIN_VALIDATION_FAILED: 'เอกสารไม่ผ่านการตรวจสอบความถูกต้องทางธุรกิจหรือการคำนวณภาษี',
  FILE_READ_ERROR: 'ไม่สามารถอ่านไฟล์ที่เลือกได้',
};
