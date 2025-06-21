import { FormattedOutput, CourseSummary } from "./types.js";

// Helper function to format time duration
const formatTime = (minutes: number): string => {
    if (minutes < 1) return "< 1 minute";
    if (minutes < 60) return `${Math.round(minutes)} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);

    if (hours === 1) {
        return remainingMinutes > 0 ? `1 hour ${remainingMinutes} minutes` : "1 hour";
    }

    return remainingMinutes > 0 ? `${hours} hours ${remainingMinutes} minutes` : `${hours} hours`;
};

export const generateCourseSummary = (formattedData: FormattedOutput): CourseSummary => {
    const course = formattedData.course;

    // Count total topics and content items
    const totalTopics = course.units.reduce((sum, unit) => sum + unit.topics.length, 0);
    const totalContentItems = course.units.reduce((sum, unit) => sum + unit.topics.reduce((topicSum, topic) => topicSum + topic.contents.length, 0), 0);

    // Get all content items
    const allContents = course.units.flatMap((unit) => unit.topics.flatMap((topic) => topic.contents));

    // Analyze content by type
    const contentTypes = {
        videos: allContents.filter((content) => content.contentKind === "Video"),
        exercises: allContents.filter((content) => content.contentKind === "Exercise"),
        articles: allContents.filter((content) => content.contentKind === "Article"),
        quizzes: allContents.filter((content) => content.contentKind === "Topic quiz"),
        unitTests: allContents.filter((content) => content.contentKind === "Topic unit test"),
        other: allContents.filter((content) => !["Video", "Exercise", "Article", "Topic quiz", "Topic unit test"].includes(content.contentKind)),
    };

    // Analyze video content
    const videosWithMetadata = contentTypes.videos.filter((video) => video.videoMetadata);
    const videosWithKeyMoments = videosWithMetadata.filter((video) => video.videoMetadata?.keyMoments && video.videoMetadata.keyMoments.length > 0);
    const videosWithSubtitles = videosWithMetadata.filter((video) => video.videoMetadata?.subtitles && video.videoMetadata.subtitles.length > 0);

    const totalVideoDurationMinutes = videosWithMetadata.reduce((sum, video) => sum + (video.videoMetadata?.durationMinutes || 0), 0);

    // Calculate time estimates
    const videoMinutes = course.totalTimeEstimate?.videoMinutes || totalVideoDurationMinutes;
    const exerciseMinutes = (course.totalTimeEstimate?.averageMinutes || 0) - videoMinutes;
    const totalMinutes = course.totalTimeEstimate?.totalMinutes || videoMinutes;

    // Generate unit summaries
    const unitSummaries = course.units.map((unit) => {
        const topicCount = unit.topics.length;
        const contentCount = unit.topics.reduce((sum, topic) => sum + topic.contents.length, 0);
        const videoCount = unit.topics.reduce((sum, topic) => sum + topic.contents.filter((content) => content.contentKind === "Video").length, 0);
        const videoDurationMinutes = unit.topics.reduce((sum, topic) => sum + topic.contents.reduce((contentSum, content) => contentSum + (content.videoMetadata?.durationMinutes || 0), 0), 0);
        const estimatedMinutes = unit.totalTimeEstimate?.totalMinutes || videoDurationMinutes;

        return {
            title: unit.title,
            topicCount,
            contentCount,
            videoCount,
            videoDurationMinutes,
            estimatedMinutes,
        };
    });

    const summary: CourseSummary = {
        course: {
            title: course.title,
            description: course.description,
            slug: course.slug,
            totalUnits: course.units.length,
            totalTopics,
            totalContentItems,
            masteryEnabled: course.masteryEnabled,
        },
        content: {
            videos: {
                total: contentTypes.videos.length,
                withMetadata: videosWithMetadata.length,
                withKeyMoments: videosWithKeyMoments.length,
                withSubtitles: videosWithSubtitles.length,
                totalDurationMinutes: Math.round(totalVideoDurationMinutes * 100) / 100,
                totalDurationFormatted: formatTime(totalVideoDurationMinutes),
            },
            exercises: contentTypes.exercises.length,
            articles: contentTypes.articles.length,
            quizzes: contentTypes.quizzes.length,
            unitTests: contentTypes.unitTests.length,
            other: contentTypes.other.length,
        },
        timeEstimate: {
            videoMinutes: Math.round(videoMinutes * 100) / 100,
            videoFormatted: formatTime(videoMinutes),
            exerciseMinutes: Math.max(0, Math.round(exerciseMinutes * 100) / 100),
            totalMinutes: Math.round(totalMinutes * 100) / 100,
            totalFormatted: formatTime(totalMinutes),
            courseChallenge: course.courseChallenge
                ? {
                      minutes: course.courseChallenge.timeEstimate.averageMinutes,
                      formatted: formatTime(course.courseChallenge.timeEstimate.averageMinutes),
                  }
                : undefined,
            masteryChallenge: course.masteryChallenge
                ? {
                      minutes: course.masteryChallenge.timeEstimate.averageMinutes,
                      formatted: formatTime(course.masteryChallenge.timeEstimate.averageMinutes),
                  }
                : undefined,
        },
        breakdown: {
            unitSummaries,
        },
        metadata: {
            extractedAt: formattedData.metadata.extractedAt,
            path: formattedData.metadata.path,
            countryCode: formattedData.metadata.countryCode,
        },
    };

    return summary;
};
