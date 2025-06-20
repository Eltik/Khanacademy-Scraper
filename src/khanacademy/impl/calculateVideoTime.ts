import { FormattedContent } from "./types.js";

export const calculateVideoTime = (contents: FormattedContent[]): number => {
    return contents.reduce((sum, content) => {
        return sum + (content.videoMetadata?.durationMinutes || 0);
    }, 0);
};
