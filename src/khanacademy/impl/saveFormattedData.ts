import { writeFileSync } from "fs";
import { join } from "path";
import { FormattedOutput, FormattedOutputWithSummary } from "./types.js";
import { generateCourseSummary } from "./generateCourseSummary.js";

export const saveFormattedData = (formattedData: FormattedOutput, filename: string): void => {
    // Generate comprehensive course summary
    const summary = generateCourseSummary(formattedData);

    // Create output with summary
    const outputWithSummary: FormattedOutputWithSummary = {
        ...formattedData,
        summary,
    };

    // Save main JSON file with summary
    const outputPath = join(process.cwd(), filename);
    const jsonString = JSON.stringify(outputWithSummary, null, 2);
    writeFileSync(outputPath, jsonString, "utf-8");
    console.log(`✅ Saved formatted data with summary to: ${outputPath}`);

    // Save separate summary file
    const summaryFilename = filename.replace(".json", "-summary.json");
    const summaryPath = join(process.cwd(), summaryFilename);
    const summaryJsonString = JSON.stringify(summary, null, 2);
    writeFileSync(summaryPath, summaryJsonString, "utf-8");
    console.log(`📋 Saved course summary to: ${summaryPath}`);

    // Display comprehensive course summary in console
    console.log(`\n📚 === COURSE SUMMARY ===`);
    console.log(`🎓 ${summary.course.title}`);
    console.log(`📄 ${summary.course.description}`);
    console.log(`🔗 Slug: ${summary.course.slug}`);
    console.log(`🏆 Mastery Enabled: ${summary.course.masteryEnabled ? "Yes" : "No"}`);

    console.log(`\n📊 === STRUCTURE ===`);
    console.log(`📂 Units: ${summary.course.totalUnits}`);
    console.log(`📋 Topics: ${summary.course.totalTopics}`);
    console.log(`📄 Total Content Items: ${summary.course.totalContentItems}`);

    console.log(`\n🎯 === CONTENT BREAKDOWN ===`);
    console.log(`🎥 Videos: ${summary.content.videos.total}`);
    console.log(`   📹 With Metadata: ${summary.content.videos.withMetadata}`);
    console.log(`   🔑 With Key Moments: ${summary.content.videos.withKeyMoments}`);
    console.log(`   📝 With Subtitles: ${summary.content.videos.withSubtitles}`);
    console.log(`   ⏱️  Total Duration: ${summary.content.videos.totalDurationFormatted}`);
    if (summary.content.exercises > 0) console.log(`💪 Exercises: ${summary.content.exercises}`);
    if (summary.content.articles > 0) console.log(`📰 Articles: ${summary.content.articles}`);
    if (summary.content.quizzes > 0) console.log(`📝 Quizzes: ${summary.content.quizzes}`);
    if (summary.content.unitTests > 0) console.log(`🧪 Unit Tests: ${summary.content.unitTests}`);
    if (summary.content.other > 0) console.log(`📦 Other Content: ${summary.content.other}`);

    console.log(`\n⏰ === TIME ESTIMATES ===`);
    console.log(`🎬 Video Content: ${summary.timeEstimate.videoFormatted}`);
    if (summary.timeEstimate.exerciseMinutes > 0) {
        console.log(`💪 Exercises/Challenges: ~${Math.round(summary.timeEstimate.exerciseMinutes)} minutes`);
    }
    console.log(`⏱️  Total Estimated Time: ${summary.timeEstimate.totalFormatted}`);

    if (summary.timeEstimate.courseChallenge) {
        console.log(`🎯 Course Challenge: ${summary.timeEstimate.courseChallenge.formatted}`);
    }
    if (summary.timeEstimate.masteryChallenge) {
        console.log(`🏆 Mastery Challenge: ${summary.timeEstimate.masteryChallenge.formatted}`);
    }

    console.log(`\n📂 === UNIT BREAKDOWN ===`);
    summary.breakdown.unitSummaries.forEach((unit, index) => {
        console.log(`${index + 1}. ${unit.title}`);
        console.log(`   📋 Topics: ${unit.topicCount} | 📄 Content: ${unit.contentCount} | 🎥 Videos: ${unit.videoCount}`);
        if (unit.videoDurationMinutes > 0) {
            const hours = Math.floor(unit.videoDurationMinutes / 60);
            const minutes = Math.round(unit.videoDurationMinutes % 60);
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            console.log(`   ⏱️  Video Time: ${timeStr} | Est. Total: ~${Math.round(unit.estimatedMinutes)}m`);
        }
    });

    console.log(`\n📅 Extracted: ${summary.metadata.extractedAt}`);
    console.log(`🌍 Region: ${summary.metadata.countryCode}`);
};
