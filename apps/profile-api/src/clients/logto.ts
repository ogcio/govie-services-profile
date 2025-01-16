import { withRetry } from "~/utils/index.js";

export type LogtoErrorBody = {
  message: string;
  code: string;
};
export class LogtoError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: LogtoErrorBody | unknown,
  ) {
    super(message);
  }
}

export class LogtoClient {
  private baseUrl: string;
  private defaultOptions: RequestInit;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      switch (response.status) {
        case 400:
          throw new LogtoError("Invalid request parameters", 400, body);
        case 401:
          throw new LogtoError("Authentication required", 401, body);
        case 403:
          throw new LogtoError("Insufficient permissions", 403, body);
        case 404:
          throw new LogtoError("Resource not found", 404, body);
        case 422:
          throw new LogtoError("Invalid request data", 422, body);
        default:
          throw new LogtoError("Unknown error occurred", response.status, body);
      }
    }

    return response.json();
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    return withRetry(async (signal: AbortSignal) => {
      const response = await fetch(`${this.baseUrl}/${path}`, {
        ...this.defaultOptions,
        ...options,
        signal,
      });
      return this.handleResponse(response) as T;
    });
  }

  async createUser(userData: {
    primaryEmail: string;
    username: string;
    name: string;
    customData: Record<string, unknown>;
  }) {
    return this.request<{ id: string; primaryEmail: string }>("users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }
}
