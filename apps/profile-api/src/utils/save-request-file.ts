import { httpErrors } from "@fastify/sensible";
import type { FastifyRequest } from "fastify";

export const saveRequestFile = async (
  request: FastifyRequest,
): Promise<string> => {
  const file = await request.files();
  if (!file) {
    throw httpErrors.badRequest("File is missing in the request");
  }

  const savedFiles = await request.saveRequestFiles();

  return savedFiles[0].filepath;
};
