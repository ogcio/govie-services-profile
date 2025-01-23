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


type ProfileDataItem = {
  value: string
  type: string
}
export type ApiProfileUser = {
  id: string,
  publicName: string,
  email: string,
  primaryUserId: string,
  safeLevel: number,
  preferredLanguage: "en" | "ga",
  createdAt: string,
  updatedAt: string,
  details?: {
    email: string; // Must be a valid email
    firstName: string;
    lastName: string;
    city?: string;
    address?: string;
    phone?: string;
    dateOfBirth?: string; // Assuming date is a string in the "date" format
    ppsn?: string;
    preferredLanguage?: "en" | "ga";
  }
};