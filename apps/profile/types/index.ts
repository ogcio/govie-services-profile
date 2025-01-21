export type NextPageProps = {
  params: {
    locale: string;
    id?: string;
    type?: string;
  };
  searchParams?: {
    [key: string]: string;
  };
};

export type _ApiProfileUser = {
  title: null | string;
  firstName: string;
  lastName: string;
  dateOfBirth: null | string;
  ppsn: null | string;
  ppsnVisible: null | boolean;
  gender: null | string;
  email: string;
  phone: null | string;
  consentToPrefillData: null | boolean;
  preferredLanguage: string;
}

type ProfileDataItem = {
  value: string
  type: string
}
export type ApiProfileUser = {
  id: string;
  public_name: string;
  email: string;
  primary_user_id: string;
  safe_level?: number;
  preferred_language?: 'en' | 'ga';
  created_at?: string;
  updated_at?: string;
  details: {
    city?: ProfileDataItem;
    email?: ProfileDataItem;
    address?: ProfileDataItem;
    phone?: ProfileDataItem;
    first_name?: ProfileDataItem;
    last_name?: ProfileDataItem;
    date_of_birth?: ProfileDataItem;
  }
};