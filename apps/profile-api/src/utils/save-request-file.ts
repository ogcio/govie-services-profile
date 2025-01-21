import { httpErrors } from "@fastify/sensible";
import { MimeTypes } from "~/const/mime-types.js";
import type { ImportProfilesSchema } from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";

export interface SavedFileInfo {
  filepath: string;
  metadata: {
    filename: string;
    mimetype: string;
    size: number | undefined;
  };
}

export const saveRequestFile = async (
  request: FastifyRequestTypebox<typeof ImportProfilesSchema>,
): Promise<SavedFileInfo> => {
  const firstFile = await request.body.file;
  if (!firstFile) {
    throw httpErrors.unprocessableEntity("File is not a valid one");
  }

  if (firstFile.mimetype !== MimeTypes.Csv) {
    throw httpErrors.unprocessableEntity("File must be a CSV");
  }

  const saved = await request.saveRequestFiles({ limits: { files: 1 } });
  const file = saved[0];
  const buffer = await file.toBuffer();

  return {
    filepath: file.filepath,
    metadata: {
      filename: file.filename,
      mimetype: file.mimetype,
      size: buffer.length,
    },
  };
};
