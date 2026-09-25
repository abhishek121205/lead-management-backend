export function undefinedAndNullCheck(value) {
    return value !== undefined && value !== null && value !== "";
}

export function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function generateUniqueSlug(baseSlug) {
    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
}
