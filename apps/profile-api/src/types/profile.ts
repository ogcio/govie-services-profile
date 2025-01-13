type ProfileTable = {
  id: string;
  public_name: string;
  email: string;
  primary_user_id: string;
  safe_level?: number;
  created_at?: string;
  updated_at?: string;
};

type ProfileWithData = ProfileTable & {
  details: Record<
    string,
    {
      value: string;
      type: string;
    }
  >;
};

export type { ProfileTable, ProfileWithData };
