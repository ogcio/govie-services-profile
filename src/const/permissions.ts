enum CitizenPermissions {
  Read = "messaging:citizen:read",
  Write = "messaging:citizen:write",
}

enum CitizenSelfPermissions {
  Read = "messaging:citizen.self:read",
  Write = "messaging:citizen.self:write",
}

enum CitizenPublicPermissions {
  Read = "messaging:citizen.public:read",
  Write = "messaging:citizen.public:write",
}

enum AdminPermissions {
  Read = "messaging:admin:read",
  Write = "messaging:admin:write",
}

enum AdminPublicPermissions {
  Read = "messaging:admin.public:read",
  Write = "messaging:admin.public:write",
}

enum AdminSelfPermissions {
  Read = "messaging:admin.self:read",
  Write = "messaging:admin.self:write",
}

export const Permissions = {
  Citizen: CitizenPermissions,
  CitizenPublic: CitizenPublicPermissions,
  CitizenSelf: CitizenSelfPermissions,
  Admin: AdminPermissions,
  AdminPublic: AdminPublicPermissions,
  AdminSelf: AdminSelfPermissions,
};
