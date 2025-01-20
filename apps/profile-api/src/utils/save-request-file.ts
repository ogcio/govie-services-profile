import { httpErrors } from "@fastify/sensible";
import type { FastifyRequest } from "fastify";
import type { ImportProfilesBody } from "~/schemas/profiles/import-profiles.js";

export const saveRequestFile = async (
  request: FastifyRequest,
): Promise<string> => {
  const file = await (request.body as ImportProfilesBody).file?.file;
  if (!file) {
    throw httpErrors.badRequest("File is missing in the request");
  }

  const savedFiles = await request.saveRequestFiles();

  return savedFiles[0].filepath;
};
