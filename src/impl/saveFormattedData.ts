import { writeFileSync } from "fs";
import { join } from "path";
import { FormattedOutput } from "./types.js";

export const saveFormattedData = (formattedData: FormattedOutput, filename: string): void => {
    const outputPath = join(process.cwd(), filename);
    const jsonString = JSON.stringify(formattedData, null, 2);
    writeFileSync(outputPath, jsonString, "utf-8");
    console.log(`✅ Saved formatted data to: ${outputPath}`);

    // Log summary information
    const course = formattedData.course;
    console.log(`📚 Course: ${course.title}`);
    console.log(`📊 Units: ${course.units.length}`);
    console.log(`📝 Total Topics: ${course.units.reduce((sum, unit) => sum + unit.topics.length, 0)}`);

    const totalContentItems = course.units.reduce((sum, unit) => sum + unit.topics.reduce((topicSum, topic) => topicSum + topic.contents.length, 0), 0);
    console.log(`📄 Total Content Items: ${totalContentItems}`);

    // Video-specific statistics
    const allContents = course.units.flatMap((unit) => unit.topics.flatMap((topic) => topic.contents));
    const videoContents = allContents.filter((content) => content.contentKind === "Video");
    const videosWithMetadata = videoContents.filter((content) => content.videoMetadata);

    if (videoContents.length > 0) {
        console.log(`🎥 Videos: ${videoContents.length}`);
        console.log(`📹 Videos with metadata: ${videosWithMetadata.length}`);

        // Calculate total video duration
        const totalDuration = videosWithMetadata.reduce((sum, video) => {
            return sum + (video.videoMetadata?.duration || 0);
        }, 0);

        if (totalDuration > 0) {
            const totalMinutes = Math.round(totalDuration / 60);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            console.log(`⏰ Total Video Duration: ${hours}h ${minutes}m (${totalMinutes} minutes)`);
        }

        // Show videos with key moments
        const videosWithKeyMoments = videosWithMetadata.filter((video) => video.videoMetadata?.keyMoments && video.videoMetadata.keyMoments.length > 0);
        if (videosWithKeyMoments.length > 0) {
            console.log(`🔑 Videos with Key Moments: ${videosWithKeyMoments.length}`);
        }

        // Show videos with subtitles
        const videosWithSubtitles = videosWithMetadata.filter((video) => video.videoMetadata?.subtitles && video.videoMetadata.subtitles.length > 0);
        if (videosWithSubtitles.length > 0) {
            console.log(`📝 Videos with Subtitles: ${videosWithSubtitles.length}`);
        }
    }

    if (course.totalTimeEstimate) {
        const te = course.totalTimeEstimate;
        console.log(`⏱️  Course Time Breakdown:`);
        if (te.videoMinutes && te.videoMinutes > 0) {
            const videoHours = Math.floor(te.videoMinutes / 60);
            const videoMins = Math.round(te.videoMinutes % 60);
            console.log(`    📹 Video Content: ${videoHours}h ${videoMins}m (${Math.round(te.videoMinutes)} minutes)`);
        }
        if (te.averageMinutes > 0) {
            console.log(`    📚 Exercises/Challenges: ~${te.averageMinutes} minutes`);
        }
        if (te.totalMinutes && te.totalMinutes > 0) {
            const totalHours = Math.floor(te.totalMinutes / 60);
            const totalMins = Math.round(te.totalMinutes % 60);
            console.log(`    ⏱️  Total Estimated Time: ${totalHours}h ${totalMins}m (${Math.round(te.totalMinutes)} minutes)`);
        }
    }

    if (course.courseChallenge?.timeEstimate) {
        console.log(`🎯 Course Challenge: ${course.courseChallenge.timeEstimate.averageMinutes} minutes`);
    }

    if (course.masteryChallenge?.timeEstimate) {
        console.log(`🏆 Mastery Challenge: ${course.masteryChallenge.timeEstimate.averageMinutes} minutes`);
    }
};
