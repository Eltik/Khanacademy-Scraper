import { FormattedTimeEstimate } from "./types.js";

export const calculateTotalTime = (timeEstimates: FormattedTimeEstimate[], videoMinutes = 0): FormattedTimeEstimate | undefined => {
    if (timeEstimates.length === 0 && videoMinutes === 0) return undefined;

    const totalLower = timeEstimates.reduce((sum, te) => sum + te.lowerBound, 0);
    const totalUpper = timeEstimates.reduce((sum, te) => sum + te.upperBound, 0);
    const totalVideo = timeEstimates.reduce((sum, te) => sum + (te.videoMinutes || 0), 0) + videoMinutes;

    return {
        lowerBound: totalLower,
        upperBound: totalUpper,
        averageMinutes: Math.round((totalLower + totalUpper) / 2),
        videoMinutes: totalVideo,
        totalMinutes: Math.round(totalVideo + (totalLower + totalUpper) / 2),
    };
};
