export const getAllowedEmailDomains = (): string[] => {
    const isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
        return ["gmail.com"];
    }
    return ["example.com", "test.com", "gmail.com"];
};