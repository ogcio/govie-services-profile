import type { FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";
import {
  PAGINATION_LIMIT_DEFAULT,
  PAGINATION_MAX_LIMIT,
  PAGINATION_MIN_OFFSET,
  PAGINATION_OFFSET_DEFAULT,
} from "../../../src/const/pagination.js";
import {
  getPaginationLinks,
  getUrlDataForPagination,
  sanitizePagination,
} from "../../../src/utils/pagination.js";

describe("Pagination Utils", () => {
  describe("getPaginationLinks", () => {
    const baseUrl = new URL("http://api.example.com/profiles");

    it("should generate basic pagination links", () => {
      const details = {
        url: baseUrl,
        limit: 20,
        offset: 0,
      };

      const links = getPaginationLinks(details, 50);

      expect(links.self.href).toBe(
        "http://api.example.com/profiles?limit=20&offset=0",
      );
      expect(links.next.href).toBe(
        "http://api.example.com/profiles?limit=20&offset=20",
      );
      expect(links.prev.href).toBeUndefined();
      expect(links.first.href).toBe(
        "http://api.example.com/profiles?limit=20&offset=0",
      );
      expect(links.last.href).toBe(
        "http://api.example.com/profiles?limit=20&offset=40",
      );
    });

    it("should handle middle page", () => {
      const details = {
        url: baseUrl,
        limit: 10,
        offset: 10,
      };

      const links = getPaginationLinks(details, 30);

      expect(links.prev.href).toBe(
        "http://api.example.com/profiles?limit=10&offset=0",
      );
      expect(links.next.href).toBe(
        "http://api.example.com/profiles?limit=10&offset=20",
      );
    });

    it("should generate correct page links", () => {
      const details = {
        url: baseUrl,
        limit: 10,
        offset: 10,
      };

      const links = getPaginationLinks(details, 25);
      const pages = links.pages;

      expect(Object.keys(pages)).toHaveLength(3);
      expect(pages["1"].href).toContain("offset=0");
      expect(pages["2"].href).toContain("offset=10");
      expect(pages["3"].href).toContain("offset=20");
    });
  });

  describe("sanitizePagination", () => {
    it("should use defaults for missing values", () => {
      const result = sanitizePagination({});

      expect(Number(result.limit)).toBe(PAGINATION_LIMIT_DEFAULT);
      expect(Number(result.offset)).toBe(PAGINATION_OFFSET_DEFAULT);
    });

    it("should handle invalid numeric strings", () => {
      const result = sanitizePagination({
        limit: "abc",
        offset: "xyz",
      });

      expect(Number(result.limit)).toBe(PAGINATION_LIMIT_DEFAULT);
      expect(Number(result.offset)).toBe(PAGINATION_OFFSET_DEFAULT);
    });

    it("should enforce min/max limits", () => {
      const result = sanitizePagination({
        limit: (PAGINATION_MAX_LIMIT + 100).toString(),
        offset: "-10",
      });

      expect(Number(result.limit)).toBe(PAGINATION_MAX_LIMIT);
      expect(Number(result.offset)).toBe(PAGINATION_MIN_OFFSET);
    });
  });

  describe("getUrlDataForPagination", () => {
    it("should extract pagination data from request", () => {
      const mockRequest = {
        originalUrl: "/profiles?limit=20&offset=40&filter=active",
      };

      const result = getUrlDataForPagination(
        mockRequest as unknown as FastifyRequest,
        "http://api.example.com",
      );

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
      expect(result.url.toString()).toBe(
        "http://api.example.com/profiles?filter=active",
      );
    });

    it("should handle missing pagination params", () => {
      const mockRequest = {
        originalUrl: "/profiles?filter=active",
      };

      const result = getUrlDataForPagination(
        mockRequest as unknown as FastifyRequest,
        "http://api.example.com",
      );

      expect(result.limit).toBeUndefined();
      expect(result.offset).toBeUndefined();
      expect(result.url.toString()).toBe(
        "http://api.example.com/profiles?filter=active",
      );
    });

    it("should preserve other query parameters", () => {
      const mockRequest = {
        originalUrl: "/profiles?limit=20&filter=active&sort=desc",
      };

      const result = getUrlDataForPagination(
        mockRequest as unknown as FastifyRequest,
        "http://api.example.com",
      );

      expect(result.url.searchParams.get("filter")).toBe("active");
      expect(result.url.searchParams.get("sort")).toBe("desc");
    });
  });
});
