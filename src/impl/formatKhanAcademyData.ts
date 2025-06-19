import { KhanAcademyResponse, FormattedOutput, FormattedUnit, FormattedTopic, FormattedContent, FormattedCourse, FormattedTimeEstimate } from "./types.js";
import { getContentForPath } from "./getContentForPath.js";
import { formatTimeEstimate } from "./formatTimeEstimate.js";
import { calculateTotalTime } from "./calculateTotalTime.js";
import { calculateVideoTime } from "./calculateVideoTime.js";
import { processVideoMetadata } from "./processVideoMetadata.js";

export const formatKhanAcademyData = async (data: KhanAcademyResponse, path: string, countryCode: string, maxVideos = 10): Promise<FormattedOutput> => {
    const course = data.data.contentRoute.listedPathData.course;
    let videosProcessed = 0;

    // Process units and topics
    const formattedUnits: FormattedUnit[] = [];

    for (let unitIndex = 0; unitIndex < course.unitChildren.length; unitIndex++) {
        const unit = course.unitChildren[unitIndex];
        console.log(`  📂 Processing unit ${unitIndex + 1}/${course.unitChildren.length}: ${unit.translatedTitle}`);
        const formattedTopics: FormattedTopic[] = [];

        for (let topicIndex = 0; topicIndex < unit.allOrderedChildren.length; topicIndex++) {
            const topic = unit.allOrderedChildren[topicIndex];
            console.log(`    📋 Processing topic ${topicIndex + 1}/${unit.allOrderedChildren.length}: ${topic.translatedTitle}`);
            const formattedContents: FormattedContent[] = [];

            const contentItems = topic.curatedChildren || [];
            for (let contentIndex = 0; contentIndex < contentItems.length; contentIndex++) {
                const content = contentItems[contentIndex];
                const formattedContent: FormattedContent = {
                    id: content.id,
                    title: content.translatedTitle,
                    description: content.translatedDescription,
                    contentKind: content.contentKind,
                    slug: content.slug,
                    url: content.canonicalUrl,
                };

                // Fetch detailed video metadata for video content
                if (content.contentKind === "Video" && videosProcessed < maxVideos) {
                    try {
                        videosProcessed++;
                        console.log(`      📹 Fetching video ${videosProcessed}/${maxVideos}: ${content.translatedTitle}`);
                        const videoPath = content.canonicalUrl.replace("https://www.khanacademy.org/", "");
                        const videoData = await getContentForPath(videoPath, countryCode);

                        if (videoData.data.contentRoute.listedPathData.content) {
                            formattedContent.videoMetadata = processVideoMetadata(videoData.data.contentRoute.listedPathData.content);
                            console.log(`         ✅ Duration: ${formattedContent.videoMetadata.durationMinutes}min`);
                        }

                        // Add a small delay to avoid overwhelming the API
                        await new Promise((resolve) => setTimeout(resolve, 200));
                    } catch (error) {
                        console.warn(`         ⚠️  Failed to fetch video metadata:`, error);
                    }
                } else if (content.contentKind === "Video") {
                    console.log(`      ⏭️  Skipping video (limit reached): ${content.translatedTitle}`);
                }

                formattedContents.push(formattedContent);
            }

            // Calculate topic video time
            const topicVideoTime = calculateVideoTime(formattedContents);
            const topicTimeEstimate =
                topicVideoTime > 0
                    ? {
                          lowerBound: 0,
                          upperBound: 0,
                          averageMinutes: 0,
                          videoMinutes: topicVideoTime,
                          totalMinutes: topicVideoTime,
                      }
                    : undefined;

            formattedTopics.push({
                id: topic.id,
                title: topic.translatedTitle,
                description: topic.translatedDescription,
                slug: topic.slug,
                url: topic.relativeUrl,
                contents: formattedContents,
                totalTimeEstimate: topicTimeEstimate,
            });
        }

        // Calculate unit total time from topic estimates
        const unitTimeEstimates = formattedTopics.map((topic) => topic.totalTimeEstimate).filter((te): te is FormattedTimeEstimate => te !== undefined);
        const unitVideoTime = formattedTopics.reduce((sum, topic) => sum + calculateVideoTime(topic.contents), 0);

        formattedUnits.push({
            id: unit.id,
            title: unit.translatedTitle,
            description: unit.translatedDescription,
            slug: unit.slug,
            url: unit.relativeUrl,
            topics: formattedTopics,
            totalTimeEstimate: calculateTotalTime(unitTimeEstimates, unitVideoTime),
        });
    }

    // Calculate course total time
    const unitTimeEstimates = formattedUnits.map((unit) => unit.totalTimeEstimate).filter((te): te is FormattedTimeEstimate => te !== undefined);

    const courseTimeEstimates: FormattedTimeEstimate[] = [];

    // Add course challenge time if available
    if (course.courseChallenge?.timeEstimate) {
        courseTimeEstimates.push(formatTimeEstimate(course.courseChallenge.timeEstimate));
    }

    // Add mastery challenge time if available
    if (course.masteryChallenge?.timeEstimate) {
        courseTimeEstimates.push(formatTimeEstimate(course.masteryChallenge.timeEstimate));
    }

    // Add unit times
    courseTimeEstimates.push(...unitTimeEstimates);

    // Calculate total course video time
    const totalCourseVideoTime = formattedUnits.reduce((sum, unit) => {
        return sum + unit.topics.reduce((topicSum, topic) => topicSum + calculateVideoTime(topic.contents), 0);
    }, 0);

    const formattedCourse: FormattedCourse = {
        id: course.id,
        title: course.translatedTitle,
        description: course.translatedDescription,
        slug: course.slug,
        url: course.relativeUrl,
        iconPath: course.iconPath,
        masteryEnabled: course.masteryEnabled,
        units: formattedUnits,
        courseChallenge: course.courseChallenge
            ? {
                  id: course.courseChallenge.id,
                  timeEstimate: formatTimeEstimate(course.courseChallenge.timeEstimate),
              }
            : undefined,
        masteryChallenge: course.masteryChallenge
            ? {
                  id: course.masteryChallenge.id,
                  timeEstimate: formatTimeEstimate(course.masteryChallenge.timeEstimate),
              }
            : undefined,
        totalTimeEstimate: calculateTotalTime(courseTimeEstimates, totalCourseVideoTime),
    };

    return {
        course: formattedCourse,
        metadata: {
            extractedAt: new Date().toISOString(),
            commitSha: data.data.content.metadata.commitSha,
            path,
            countryCode,
        },
    };
};
