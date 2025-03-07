export interface Contact {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  birthDate: Date;
  locationType: 'home' | 'clinic';
  address?: string;
  injectionType: 'intravenous' | 'subcutaneous';
  antibiotic: string;
  color: string;
  isArchived?: boolean;
  antibioticRecurrenceValue?: number; // New field
  antibioticRecurrenceUnit?: 'day' | 'week'; // New field
}