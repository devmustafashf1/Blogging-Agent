const axios = require("axios");

const REDDIT_BASE = "https://www.reddit.com";
const HEADERS = {
  "User-Agent": "BloggingAgent/1.0 (by YourRedditUsername)",
  Accept: "application/json",
};

const parsePost = (child) => {
  const d = child.data;
  const createdAt = new Date(d.created_utc * 1000);
  const ageHours  = parseFloat(((Date.now() - createdAt.getTime()) / 1000 / 3600).toFixed(2));
  return {
    id:                d.id,
    title:             d.title,
    body:              d.selftext?.slice(0, 300) || "",
    subreddit:         d.subreddit,
    author:            d.author,
    url:               `https://www.reddit.com${d.permalink}`,
    externalUrl:       d.url,
    flair:             d.link_flair_text || null,
    score:             d.score,
    upvoteRatio:       d.upvote_ratio,
    numComments:       d.num_comments,
    numCrossposts:     d.num_crossposts || 0,
    gilded:            d.gilded || 0,
    isOriginalContent: d.is_original_content || false,
    stickied:          d.stickied || false,
    distinguished:     d.distinguished || null,
    createdAt:         createdAt.toISOString(),
    ageHours,
  };
};

const fetchRedditFeed = async (subreddit = "all", feed = "hot", limit = 25, timeFilter = "day") => {
  const validFeeds = ["hot", "rising", "new", "top", "controversial"];
  if (!validFeeds.includes(feed)) throw new Error(`Invalid feed: ${feed}`);
  let url = `${REDDIT_BASE}/r/${subreddit}/${feed}.json?limit=${limit}&raw_json=1`;
  if (feed === "top" || feed === "controversial") url += `&t=${timeFilter}`;
  const { data } = await axios.get(url, { headers: HEADERS });
  return (data?.data?.children || []).map(parsePost);
};

const searchReddit = async (query, sort = "hot", timeFilter = "week", limit = 25, subreddit = null) => {
  const base = subreddit
    ? `${REDDIT_BASE}/r/${subreddit}/search.json`
    : `${REDDIT_BASE}/search.json`;
  const url = `${base}?q=${encodeURIComponent(query)}&sort=${sort}&t=${timeFilter}&limit=${limit}&raw_json=1${subreddit ? "&restrict_sr=1" : ""}`;
  const { data } = await axios.get(url, { headers: HEADERS });
  return (data?.data?.children || []).map(parsePost);
};

const fetchComments = async (subreddit, postId, limit = 20) => {
  const url = `${REDDIT_BASE}/r/${subreddit}/comments/${postId}.json?sort=top&limit=${limit}&raw_json=1`;
  const { data } = await axios.get(url, { headers: HEADERS });
  return (data?.[1]?.data?.children || [])
    .filter((c) => c.kind === "t1")
    .map((c) => ({
      id:         c.data.id,
      author:     c.data.author,
      body:       c.data.body?.slice(0, 400) || "",
      score:      c.data.score,
      createdAt:  new Date(c.data.created_utc * 1000).toISOString(),
      isTopLevel: !c.data.parent_id?.startsWith("t1_"),
    }))
    .slice(0, limit);
};

const fetchSubredditInfo = async (subreddit) => {
  const url = `${REDDIT_BASE}/r/${subreddit}/about.json`;
  const { data } = await axios.get(url, { headers: HEADERS });
  const d = data?.data || {};
  return {
    name:        d.display_name,
    title:       d.title,
    description: d.public_description?.slice(0, 200),
    subscribers: d.subscribers,
    activeUsers: d.active_user_count,
    created:     new Date(d.created_utc * 1000).toISOString(),
  };
};

// Fetch ALL feed types for a subreddit at once
const fetchAllFeeds = async (subreddit = "all", limit = 20) => {
  const [hot, rising, top, newPosts] = await Promise.allSettled([
    fetchRedditFeed(subreddit, "hot",   limit),
    fetchRedditFeed(subreddit, "rising", limit),
    fetchRedditFeed(subreddit, "top",    limit, "day"),
    fetchRedditFeed(subreddit, "new",    Math.ceil(limit / 2)),
  ]);
  return {
    hot:     hot.status     === "fulfilled" ? hot.value     : [],
    rising:  rising.status  === "fulfilled" ? rising.value  : [],
    top:     top.status     === "fulfilled" ? top.value     : [],
    new:     newPosts.status === "fulfilled" ? newPosts.value : [],
  };
};

module.exports = {
  fetchRedditFeed,
  fetchAllFeeds,
  searchReddit,
  fetchComments,
  fetchSubredditInfo,
};