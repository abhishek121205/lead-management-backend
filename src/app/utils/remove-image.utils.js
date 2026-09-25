import fs from "fs/promises";

export const removeUploadedFile = async (req) => {
    if (req.file?.path) {
        try {
            await fs.unlink(req.file.path);
        } catch (_) { }
    }
};
