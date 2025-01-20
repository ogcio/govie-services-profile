import { httpErrors } from "@fastify/sensible";
import { MimeTypes } from "~/const/mime-types.js";
import type { ImportProfilesSchema } from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";

export const saveRequestFile = async (
  request: FastifyRequestTypebox<typeof ImportProfilesSchema>,
): Promise<string> => {
  const firstFile = await request.body.file;
  if (!firstFile) {
    throw httpErrors.badRequest("File is not a valid one");
  }

  if (firstFile.mimetype !== MimeTypes.Csv) {
    throw httpErrors.badRequest("File must be a CSV");
  }

  const saved = await request.saveRequestFiles({ limits: { files: 1 } });

  return saved[0].filepath;
};
