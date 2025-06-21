// Re-export all types
export * from "./impl/types.js";

// Re-export all functions
export { getContentForPath } from "./impl/getContentForPath.js";
export { formatTimeEstimate } from "./impl/formatTimeEstimate.js";
export { calculateTotalTime } from "./impl/calculateTotalTime.js";
export { calculateVideoTime } from "./impl/calculateVideoTime.js";
export { processVideoMetadata } from "./impl/processVideoMetadata.js";
export { formatKhanAcademyData } from "./impl/formatKhanAcademyData.js";
export { saveFormattedData } from "./impl/saveFormattedData.js";
export { generateCourseSummary } from "./impl/generateCourseSummary.js";

// Import functions for main execution
import { getContentForPath } from "./impl/getContentForPath.js";
import { formatKhanAcademyData } from "./impl/formatKhanAcademyData.js";
import { saveFormattedData } from "./impl/saveFormattedData.js";

// Legacy main execution function - now available as a function export
export const processAllCourses = async () => {
    const paths = [
        {
            path: "math/calculus-2",
            countryCode: "US",
        },
    ];

    for (const pathConfig of paths) {
        console.log(`\n🔄 Processing: ${pathConfig.path}`);

        try {
            const data = await getContentForPath(pathConfig.path, pathConfig.countryCode);
            // Increase video limit for more comprehensive data
            const formattedData = await formatKhanAcademyData(data, pathConfig.path, pathConfig.countryCode, 50);

            // Generate filename based on path
            const filename = `${pathConfig.path.replace(/\//g, "-")}.json`;
            saveFormattedData(formattedData, filename);
        } catch (error) {
            console.error(`❌ Error processing ${pathConfig.path}:`, error);
        }
    }

    console.log("\n🎉 All courses processed!");
};
