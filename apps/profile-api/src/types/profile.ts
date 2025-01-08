type ProfileTable = {
  id: string;
  public_name: string;
  email: string;
  primary_user_id: string;
  safe_level: number;
  created_at?: Date;
  updated_at?: Date;
};

export type { ProfileTable };
