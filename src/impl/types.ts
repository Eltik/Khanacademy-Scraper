// Type definitions for Khan Academy API response types
export type ContentTypename = "Content" | "Video";
export type ContentMetadataTypename = "ContentMetadata";
export type ContentRouteResultTypename = "ContentRouteResult";
export type ContentRouteDataTypename = "ContentRouteData";
export type CourseTypename = "Course";
export type KeyMomentTypename = "KeyMoment";
export type LearnableCourseChallenge = "LearnableCourseChallenge";
export type LearnableMasteryChallenge = "LearnableMasteryChallenge";
export type TopicTypename = "Topic";
export type TimeEstimateTypename = "TimeEstimate";
export type CurationDataTypename = "CurationData";
export type CourseIntroModuleTypename = "CourseIntroModule";
export type SponsorFooterAttributionTypename = "SponsorFooterAttribution";
export type ExerciseTypename = "Exercise";
export type UnitTypename = "Unit";
export type LessonTypename = "Lesson";
export type VideoTypename = "Video";
export type ArticleTypename = "Article";
export type TopicQuizTypename = "TopicQuiz";
export type TopicUnitTestTypename = "TopicUnitTest";
export type SubtitleTypename = "VideoSubtitle";
export type ThumbnailUrlTypename = "ThumbnailUrl";

// Union type for curatedChildren which can be different content types
export type CuratedChildTypename = LessonTypename | VideoTypename | ArticleTypename | TopicQuizTypename | TopicUnitTestTypename;

export interface KhanAcademyResponse {
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
export interface FormattedTimeEstimate {
    lowerBound: number;
    upperBound: number;
    averageMinutes: number;
    videoMinutes?: number; // Total video duration in minutes
    totalMinutes?: number; // Total including video + exercise/challenge time
}

export interface FormattedKeyMoment {
    startOffset: number;
    endOffset: number;
    label: string;
}

export interface FormattedSubtitle {
    text: string;
    startTime: number;
    endTime: number;
    isValid: boolean;
}

export interface FormattedThumbnail {
    url: string;
    category: string;
}

export interface FormattedVideoMetadata {
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

export interface FormattedContent {
    id: string;
    title: string;
    description: string;
    contentKind: string;
    slug: string;
    url: string;
    timeEstimate?: FormattedTimeEstimate;
    videoMetadata?: FormattedVideoMetadata;
}

export interface FormattedTopic {
    id: string;
    title: string;
    description: string;
    slug: string;
    url: string;
    contents: FormattedContent[];
    totalTimeEstimate?: FormattedTimeEstimate;
}

export interface FormattedUnit {
    id: string;
    title: string;
    description: string;
    slug: string;
    url: string;
    topics: FormattedTopic[];
    totalTimeEstimate?: FormattedTimeEstimate;
}

export interface FormattedCourse {
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

export interface FormattedOutput {
    course: FormattedCourse;
    metadata: {
        extractedAt: string;
        commitSha: string;
        path: string;
        countryCode: string;
    };
}
