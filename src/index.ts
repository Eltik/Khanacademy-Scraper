import { writeFileSync } from "fs";
import { join } from "path";

// Type definitions for Khan Academy API response types
type ContentTypename = "Content" | "Video";
type ContentMetadataTypename = "ContentMetadata";
type ContentRouteResultTypename = "ContentRouteResult";
type ContentRouteDataTypename = "ContentRouteData";
type CourseTypename = "Course";
type KeyMomentTypename = "KeyMoment";
type LearnableCourseChallenge = "LearnableCourseChallenge";
type LearnableMasteryChallenge = "LearnableMasteryChallenge";
type TopicTypename = "Topic";
type TimeEstimateTypename = "TimeEstimate";
type CurationDataTypename = "CurationData";
type CourseIntroModuleTypename = "CourseIntroModule";
type SponsorFooterAttributionTypename = "SponsorFooterAttribution";
type ExerciseTypename = "Exercise";
type UnitTypename = "Unit";
type LessonTypename = "Lesson";
type VideoTypename = "Video";
type ArticleTypename = "Article";
type TopicQuizTypename = "TopicQuiz";
type TopicUnitTestTypename = "TopicUnitTest";
type SubtitleTypename = "VideoSubtitle";
type ThumbnailUrlTypename = "ThumbnailUrl";

// Union type for curatedChildren which can be different content types
type CuratedChildTypename = LessonTypename | VideoTypename | ArticleTypename | TopicQuizTypename | TopicUnitTestTypename;

const getContentForPath = async (path: string, countryCode: string) => {
    const url = `https://www.khanacademy.org/api/internal/graphql/ContentForPath?fastly_cacheable=persist_until_publish&pcv=892e3563cdaf14e26db1092266abcc8f9fd3419b&hash=45296627&variables=%7B%22path%22%3A%22${path}%22%2C%22countryCode%22%3A%22${countryCode}%22%7D&lang=en&app=khanacademy`;
    const response = await fetch(url);
    const data = (await response.json()) as KhanAcademyResponse;
    return data;
};

interface KhanAcademyResponse {
    data: {
        content: {
            __typename: ContentTypename;
            metadata: {
                __typename: ContentMetadataTypename;
                commitSha: string;
            };
        };
        contentRoute: {
            __typename: ContentRouteResultTypename;
            listedPathData: {
                __typename: ContentRouteDataTypename;
                content: {
                    __typename: ContentTypename;
                    augmentedTranscript: null;
                    authorNames: string[];
                    clarificationsEnabled: boolean;
                    contentKind: string;
                    dateAdded: string;
                    description: string;
                    descriptionHtml: string;
                    downloadUrls: string; // JSON stringified. Object contains "{\"m3u8\":\"<url>\",\"mp4\":\"<url>\"}"
                    duration: number; // in seconds
                    educationalLevel: string;
                    id: string;
                    imageUrl: string;
                    kaUrl: string;
                    kaUserLicense: string;
                    keyMoments: {
                        __typename: KeyMomentTypename;
                        endOffset: number;
                        label: string;
                        startOffset: number;
                    }[];
                    keywords: string; // separated by commas
                    learningResourceType: string;
                    nodeSlug: string;
                    readableId: string;
                    relativeUrl: string;
                    sha: string;
                    slug: string;
                    subtitles: {
                        __typename: SubtitleTypename;
                        text: string;
                        startTime: number;
                        endTime: number;
                        kaIsValid: boolean;
                    }[];
                    thumbnailUrls: {
                        __typename: ThumbnailUrlTypename;
                        url: string;
                        category: string;
                    }[];
                    translatedCustomTitleTag: string;
                    translatedDescription: string;
                    translatedDescriptionHtml: string;
                    translatedTitle: string;
                    translatedYoutubeId: string;
                    translatedYoutubeLang: string;
                    videoAuthorList: string[];
                    youtubeId: string;
                } | null;
                course: {
                    __typename: CourseTypename;
                    contentKind: string;
                    courseChallenge: {
                        __typename: LearnableCourseChallenge;
                        contentDescriptor: string;
                        contentKind: string;
                        exerciseLength: number;
                        id: string;
                        parentTopic: {
                            __typename: TopicTypename;
                            id: string;
                            parent: {
                                __typename: TopicTypename;
                                id: string;
                                masteryEnabled: boolean;
                            };
                        };
                        slug: string;
                        timeEstimate: {
                            __typename: TimeEstimateTypename;
                            lowerBound: number;
                            upperBound: number;
                        };
                        urlWithinCurationNode: string;
                    };
                    curation: {
                        __typename: CurationDataTypename;
                        excludedChildren: string[];
                        hideCommunityQuestions: boolean;
                        hideSubjectIntro: boolean;
                        modules: {
                            __typename: CourseIntroModuleTypename;
                            callToAction: string;
                            description: string;
                            kind: string;
                            link: string; // Video:<some_id>
                            title: string;
                            untranslatedFields: string[];
                            video: string; // can be empty string
                        }[];
                        sponsorFooterAttribution: {
                            __typename: SponsorFooterAttributionTypename;
                            footnoteHtml: string;
                            imageBaselineAligned: string | null;
                            imageCaption: string | null;
                            imageUrl: string | null;
                            taglineHtml: string | null;
                        };
                    };
                    iconPath: string;
                    id: string;
                    isListedForLearners: boolean;
                    lowerToc: boolean;
                    masterableExercises: {
                        __typename: ExerciseTypename;
                        id: string;
                    }[];
                    masteryChallenge: {
                        __typename: LearnableMasteryChallenge;
                        contentDescriptor: string;
                        contentKind: string;
                        exerciseLength: number;
                        id: string;
                        parentTopic: {
                            __typename: TopicTypename;
                            id: string;
                            parent: {
                                __typename: TopicTypename;
                                id: string;
                                masteryEnabled: boolean;
                            };
                        };
                        slug: string;
                        timeEstimate: {
                            __typename: TimeEstimateTypename;
                            lowerBound: number;
                            upperBound: number;
                        };
                        urlWithinCurationNode: string;
                    };
                    masteryEnabled: boolean;
                    parent: {
                        __typename: TopicTypename;
                        contentKind: string;
                        id: string;
                        relativeUrl: string;
                        slug: string;
                        translatedTitle: string;
                    };
                    relativeUrl: string;
                    slug: string;
                    translatedCustomTitleTag: string;
                    translatedDescription: string;
                    translatedTitle: string;
                    unitChildren: {
                        __typename: UnitTypename;
                        allOrderedChildren: {
                            __typename: TopicTypename;
                            curatedChildren?: {
                                __typename: CuratedChildTypename;
                                canonicalUrl: string;
                                contentDescriptor: string;
                                contentKind: string;
                                id: string;
                                parentTopic: {
                                    __typename: TopicTypename;
                                    id: string;
                                    parent: {
                                        __typename: TopicTypename;
                                        id: string;
                                        masteryEnabled: boolean;
                                    };
                                };
                                progressKey: string;
                                slug: string;
                                translatedCustomTitleTag: string;
                                translatedDescription: string;
                                translatedTitle: string;
                                urlWithinCurationNode: string;
                            }[];
                            id: string;
                            key: string;
                            relativeUrl: string;
                            slug: string;
                            translatedDescription: string;
                            translatedTitle: string;
                        }[];
                        id: string;
                        key: string;
                        relativeUrl: string;
                        slug: string;
                        translatedDescription: string;
                        translatedTitle: string;
                    }[];
                    userAuthoredContentTypes: string[];
                };
                lesson: null;
            };
            resolvedPath: string;
            unlistedPathData: null;
        };
    };
}

// Formatted output interfaces
interface FormattedTimeEstimate {
    lowerBound: number;
    upperBound: number;
    averageMinutes: number;
    videoMinutes?: number; // Total video duration in minutes
    totalMinutes?: number; // Total including video + exercise/challenge time
}

interface FormattedKeyMoment {
    startOffset: number;
    endOffset: number;
    label: string;
}

interface FormattedSubtitle {
    text: string;
    startTime: number;
    endTime: number;
    isValid: boolean;
}

interface FormattedThumbnail {
    url: string;
    category: string;
}

interface FormattedVideoMetadata {
    duration?: number; // in seconds
    durationMinutes?: number; // calculated from duration
    downloadUrls?: {
        m3u8?: string;
        mp4?: string;
    };
    keyMoments?: FormattedKeyMoment[];
    subtitles?: FormattedSubtitle[];
    thumbnailUrls?: FormattedThumbnail[];
    youtubeId?: string;
    authorNames?: string[];
    dateAdded?: string;
    keywords?: string[];
    educationalLevel?: string;
}

interface FormattedContent {
    id: string;
    title: string;
    description: string;
    contentKind: string;
    slug: string;
    url: string;
    timeEstimate?: FormattedTimeEstimate;
    videoMetadata?: FormattedVideoMetadata;
}

interface FormattedTopic {
    id: string;
    title: string;
    description: string;
    slug: string;
    url: string;
    contents: FormattedContent[];
    totalTimeEstimate?: FormattedTimeEstimate;
}

interface FormattedUnit {
    id: string;
    title: string;
    description: string;
    slug: string;
    url: string;
    topics: FormattedTopic[];
    totalTimeEstimate?: FormattedTimeEstimate;
}

interface FormattedCourse {
    id: string;
    title: string;
    description: string;
    slug: string;
    url: string;
    iconPath: string;
    masteryEnabled: boolean;
    units: FormattedUnit[];
    courseChallenge?: {
        id: string;
        timeEstimate: FormattedTimeEstimate;
    };
    masteryChallenge?: {
        id: string;
        timeEstimate: FormattedTimeEstimate;
    };
    totalTimeEstimate?: FormattedTimeEstimate;
}

interface FormattedOutput {
    course: FormattedCourse;
    metadata: {
        extractedAt: string;
        commitSha: string;
        path: string;
        countryCode: string;
    };
}

const formatTimeEstimate = (timeEstimate: { lowerBound: number; upperBound: number }): FormattedTimeEstimate => {
    return {
        lowerBound: timeEstimate.lowerBound,
        upperBound: timeEstimate.upperBound,
        averageMinutes: Math.round((timeEstimate.lowerBound + timeEstimate.upperBound) / 2),
        videoMinutes: 0,
        totalMinutes: Math.round((timeEstimate.lowerBound + timeEstimate.upperBound) / 2),
    };
};

const calculateTotalTime = (timeEstimates: FormattedTimeEstimate[], videoMinutes = 0): FormattedTimeEstimate | undefined => {
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

const calculateVideoTime = (contents: FormattedContent[]): number => {
    return contents.reduce((sum, content) => {
        return sum + (content.videoMetadata?.durationMinutes || 0);
    }, 0);
};

const processVideoMetadata = (videoContent: NonNullable<KhanAcademyResponse["data"]["contentRoute"]["listedPathData"]["content"]>): FormattedVideoMetadata => {
    const metadata: FormattedVideoMetadata = {};

    if (videoContent.duration) {
        metadata.duration = videoContent.duration;
        metadata.durationMinutes = Math.round((videoContent.duration / 60) * 100) / 100; // Round to 2 decimal places
    }

    if (videoContent.downloadUrls) {
        try {
            const downloadData = JSON.parse(videoContent.downloadUrls);
            metadata.downloadUrls = {
                m3u8: downloadData.m3u8,
                mp4: downloadData.mp4,
            };
        } catch (e) {
            console.warn("Failed to parse download URLs:", e);
        }
    }

    if (videoContent.keyMoments && videoContent.keyMoments.length > 0) {
        metadata.keyMoments = videoContent.keyMoments.map((km) => ({
            startOffset: km.startOffset,
            endOffset: km.endOffset,
            label: km.label,
        }));
    }

    if (videoContent.subtitles && videoContent.subtitles.length > 0) {
        metadata.subtitles = videoContent.subtitles.map((sub) => ({
            text: sub.text,
            startTime: sub.startTime,
            endTime: sub.endTime,
            isValid: sub.kaIsValid,
        }));
    }

    if (videoContent.thumbnailUrls && videoContent.thumbnailUrls.length > 0) {
        metadata.thumbnailUrls = videoContent.thumbnailUrls.map((thumb) => ({
            url: thumb.url,
            category: thumb.category,
        }));
    }

    if (videoContent.youtubeId) {
        metadata.youtubeId = videoContent.youtubeId;
    }

    if (videoContent.authorNames && videoContent.authorNames.length > 0) {
        metadata.authorNames = videoContent.authorNames;
    }

    if (videoContent.dateAdded) {
        metadata.dateAdded = videoContent.dateAdded;
    }

    if (videoContent.keywords) {
        metadata.keywords = videoContent.keywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
    }

    if (videoContent.educationalLevel) {
        metadata.educationalLevel = videoContent.educationalLevel;
    }

    return metadata;
};

const formatKhanAcademyData = async (data: KhanAcademyResponse, path: string, countryCode: string, maxVideos = 10): Promise<FormattedOutput> => {
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
            const topicTimeEstimate = topicVideoTime > 0 ? {
                lowerBound: 0,
                upperBound: 0,
                averageMinutes: 0,
                videoMinutes: topicVideoTime,
                totalMinutes: topicVideoTime,
            } : undefined;

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

const saveFormattedData = (formattedData: FormattedOutput, filename: string): void => {
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

// Main execution
(async () => {
    const paths = [
        {
            path: "math/ap-calculus-ab",
            countryCode: "US",
        },
        {
            path: "math/ap-calculus-bc",
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
})();
