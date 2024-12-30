import type { FastifyRequest } from "fastify";
import type { GenericResponse } from "~/types/generic-response.js";
import type { PaginationDetails } from "~/types/pagination.js";
import { getPaginationLinks, getUrlDataForPagination } from "./pagination.js";

export const formatAPIResponse = <T>(params: {
  data: T[];
  pagination?: PaginationDetails;
  request?: FastifyRequest;
  totalCount: number;
}): GenericResponse<T[]> => {
  const response: GenericResponse<T[]> = {
    data: params.data,
  };

  if (params.pagination) {
    response.metadata = {
      links: getPaginationLinks(params.pagination, params.totalCount),
      totalCount: params.totalCount,
    };

    return response;
  }
  if (params.request) {
    const paginationDetails = getUrlDataForPagination(params.request);
    response.metadata = {
      links: getPaginationLinks(paginationDetails, params.totalCount),
      totalCount: params.totalCount,
    };

    return response;
  }

  return response;
};
