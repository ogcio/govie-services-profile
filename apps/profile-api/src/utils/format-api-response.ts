import type { FastifyRequest } from "fastify";
import type { EnvConfig } from "~/plugins/external/env.js";
import type { GenericResponse, PaginationDetails } from "~/types/index.js";
import { getPaginationLinks, getUrlDataForPagination } from "./index.js";

export const formatAPIResponse = <T>(params: {
  data: T[];
  config: EnvConfig;
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
    const paginationDetails = getUrlDataForPagination(
      params.request,
      params.config.HOST_URL,
    );
    response.metadata = {
      links: getPaginationLinks(paginationDetails, params.totalCount),
      totalCount: params.totalCount,
    };

    return response;
  }

  return response;
};
