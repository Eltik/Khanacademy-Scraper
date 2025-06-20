import { KhanAcademyResponse, FormattedVideoMetadata } from "./types.js";

export const processVideoMetadata = (videoContent: NonNullable<KhanAcademyResponse["data"]["contentRoute"]["listedPathData"]["content"]>): FormattedVideoMetadata => {
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
