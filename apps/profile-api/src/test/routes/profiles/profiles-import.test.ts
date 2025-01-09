import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  type Mock,
  afterAll,
  beforeAll,
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
} from "../../../services/profile/sql/index.js";
import { build } from "../../test-server-builder.js";

vi.mock("../../../services/profile/sql/index.js", () => ({
  createProfileImport: vi.fn(),
  createProfileImportDetails: vi.fn(),
  getProfileImportStatus: vi.fn(),
}));

describe("/profiles/import", () => {
  let app: FastifyInstance;
  const endpoint = "/api/v1/profiles-import";
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

  beforeAll(async () => {
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
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
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
      status: "completed",
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

    expect(response.statusCode).toBe(400);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty("code", "REQUEST_ERROR");
    expect(payload).toHaveProperty("detail", "Profiles array cannot be empty");
  });

  it("should require organization-id query parameter", async () => {
    const response = await app.inject({
      method: "POST",
      url: endpoint,
      payload: validProfilesPayload.profiles,
      headers: {
        "content-type": "application/json",
      },
    });

    expect(response.statusCode).toBe(422);
    const payload = JSON.parse(response.payload);
    expect(payload).toHaveProperty("code", "VALIDATION_ERROR");
    expect(payload.validation[0]).toHaveProperty("fieldName", "organizationId");
    expect(payload.validation[0]).toHaveProperty(
      "message",
      "must have required property 'organizationId'",
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
    // (createProfileImport as Mock).mockImplementationOnce(async () => {
    //   throw new Error("Database error");
    // });
    // vi.mocked(createProfileImport).mockRejectedValueOnce(
    //   new Error("Database error"),
    // );
    (createProfileImport as Mock).mockRejectedValue(
      new Error("Database error"),
    );

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
    expect(payload).toHaveProperty("message", "Internal server error");
  });
});
