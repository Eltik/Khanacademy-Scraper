import { KhanAcademyResponse } from "./types.js";

export const getContentForPath = async (path: string, countryCode: string): Promise<KhanAcademyResponse> => {
    const url = `https://www.khanacademy.org/api/internal/graphql/ContentForPath?fastly_cacheable=persist_until_publish&pcv=892e3563cdaf14e26db1092266abcc8f9fd3419b&hash=45296627&variables=%7B%22path%22%3A%22${path}%22%2C%22countryCode%22%3A%22${countryCode}%22%7D&lang=en&app=khanacademy`;
    const response = await fetch(url);
    const data = (await response.json()) as KhanAcademyResponse;
    return data;
};
