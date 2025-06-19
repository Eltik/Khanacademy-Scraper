import { FormattedTimeEstimate } from "./types.js";

export const formatTimeEstimate = (timeEstimate: { lowerBound: number; upperBound: number }): FormattedTimeEstimate => {
    return {
        lowerBound: timeEstimate.lowerBound,
        upperBound: timeEstimate.upperBound,
        averageMinutes: Math.round((timeEstimate.lowerBound + timeEstimate.upperBound) / 2),
        videoMinutes: 0,
        totalMinutes: Math.round((timeEstimate.lowerBound + timeEstimate.upperBound) / 2),
    };
};
