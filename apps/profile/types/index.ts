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

export type ApiProfileUser = {
  id: string;
  publicName: string;
  email: string;
  primaryUserId: string;
  safeLevel?: number;
  preferredLanguage: "en" | "ga";
  createdAt?: string;
  updatedAt?: string;
  details?: {
    email: string;
    firstName: string;
    lastName: string;
    city?: string;
    address?: string;
    phone?: string;
    dateOfBirth?: string;
    ppsn?: string;
    preferredLanguage: "en" | "ga";
  };
};