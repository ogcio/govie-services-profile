import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  type Mock,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import {
  createProfileImport,
  createProfileImportDetails,
  getProfileImportStatus,
} from "../../../services/profiles/sql/index.js";
import { build } from "../../test-server-builder.js";

vi.mock("../../../services/profiles/sql/create-profile-import.js");
vi.mock("../../../services/profiles/sql/create-profile-import-details.js");
vi.mock("../../../services/profiles/sql/get-profile-import-status.js");

describe("/profiles/import-profiles", () => {
  let app: FastifyInstance;
  const endpoint = "/api/v1/profiles/import-profiles";
  const url = `${endpoint}?organizationId=org-123`;

  const validProfilesPayload = {
    profiles: [
      {
        address: "123 Test St",
        city: "Testville",
        first_name: "Test",
        last_name: "User",
        email: "test1@example.com",
        phone: "1234567890",
        date_of_birth: "1990-01-01",
      },
      {
        address: "456 Test St",
        city: "Testville",
        first_name: "Test",
        last_name: "User",
        email: "test2@example.com",
        phone: "1234567890",
        date_of_birth: "1990-01-01",
      },
    ],
  };

  beforeEach(async () => {
    app = await build();
    app.addHook("onRequest", async (req: FastifyRequest) => {
      // Override the request decorator
      app.checkPermissions = async (
        request: FastifyRequest,
        _reply: FastifyReply,
        _permissions: string[],
        _matchConfig?: { method: "AND" | "OR" },
      ) => {
        req.userData = {
          userId: "userId",
          accessToken: "accessToken",
          organizationId: "organisationId",
          isM2MApplication: false,
        };

        request.userData = req.userData;
      };
    });
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it("should handle valid profiles import", async () => {
    (createProfileImport as Mock).mockResolvedValue("import-123");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-123"]);
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const response = await app.inject({
      method: "POST",
      url,
      payload: validProfilesPayload.profiles,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({
      status: ImportStatus.COMPLETED,
    });
  });

  it("should reject empty profiles array", async () => {
    const response = await app.inject({
      method: "POST",
      url,
      payload: [],
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty("code", "VALIDATION_ERROR");
    expect(payload).toHaveProperty(
      "detail",
      "body must NOT have fewer than 1 items",
    );
  });

  it("should validate profile data structure", async () => {
    const response = await app.inject({
      method: "POST",
      url,
      payload: [
        {
          invalidField: "value",
        },
      ],
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("should handle database errors", async () => {
    (createProfileImport as Mock).mockRejectedValue(
      new Error("Database error"),
    );
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-123"]);
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.FAILED);

    const response = await app.inject({
      method: "POST",
      url,
      payload: validProfilesPayload.profiles,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(createProfileImport).toHaveBeenCalled();

    expect(response.statusCode).toBe(500);
    const payload = JSON.parse(response.payload);
    console.dir(payload, { depth: 10 });
  });
});
