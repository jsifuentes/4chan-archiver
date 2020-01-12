module.exports = function convertPostToIndex (board, post) {
    return {
        _id: board + "/" + post.no,
        board: board,
        author: {
            name: post.name || "",
            group: post.id || "",
            trip: post.trip || "",
            capcode: post.capcode || "",
            country_iso: post.country || "",
            country: post.country_name || ""
        },
        subject: post.sub || "",
        body: post.com || "",
        file: {
            name: post.filename + post.ext || null,
            width: post.w || null,
            height: post.h || null,
            thumbnail_width: post.tn_w || null,
            thumbnail_height: post.tn_h || null,
            size: post.fsize || null,
            md5: post.md5 || null,
            is_deleted: !!post.filedeleted
        },
        posted_at: post.time * 1000,
        timestamp: post.time,
        timestamp_ms: post.tim,
        reply_to: post.resto,
        is_sticky: !!post.sticky,
        is_closed: !!post.closed,
        is_spoiler: !!post.spoiler,
        unique_ips: post.unique_ips || null
    }
}