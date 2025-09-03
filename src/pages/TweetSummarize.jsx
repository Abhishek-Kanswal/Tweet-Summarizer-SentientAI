"use client";

import { useState } from "react";
import { SummaryCard } from "@/components/tweetSummarize/summary-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Link2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

// -----------------------------
// Parsing helpers
// -----------------------------
function parseAuthor(md) {
  let authorName = "";
  let handle = "";

  const nameMatch = md.match(
    /\[(.*?) !\[.*?\]\(.*?\)\]\(https:\/\/x\.com\/[a-zA-Z0-9_]+\)/
  );
  if (nameMatch) authorName = nameMatch[1].trim();

  const handleMatch = md.match(/\[@([a-zA-Z0-9_]+)\]\(https:\/\/x\.com\/\1\)/);
  if (handleMatch) handle = `@${handleMatch[1]}`;

  if (!authorName) authorName = handle.replace("@", "");

  return { authorName, handle };
}

function parseTweet(md) {
  let content = "";
  let timestamp = "";
  let media = [];

  const textMatch = md.match(/Conversation[\s\S]*?\n\n([\s\S]*?)\n\n\d/);
  if (textMatch) {
    let section = textMatch[1];
    const mediaMatches = [...section.matchAll(/!\[.*?\]\((.*?)\)/g)];
    media = mediaMatches
      .map((m) => m[1])
      .filter(
        (url) =>
          !url.includes("abs-0.twimg.com/emoji") &&
          !url.includes("unavatar.io") &&
          !url.includes("profile_images")
      );

    let html = section
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\[\]\([^)]+\)/g, "")
      .trim();

    html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    html = html.replace(/\n/g, "<br />");
    html = html.replace(/(<br\s*\/?>)+$/g, "");
    content = html;
  }

  const timeMatch = md.match(/\[(.*?) · (.*?)\]\(/);
  if (timeMatch) timestamp = `${timeMatch[1]} · ${timeMatch[2]}`;

  return { content, timestamp, media };
}

// -----------------------------
// Main Component
// -----------------------------
function TweetSummarize() {
  const [url, setUrl] = useState("");
  const [tweet, setTweet] = useState(null);
  const [invalidUrl, setInvalidUrl] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    const isValidTweetUrl =
      /^https?:\/\/(www\.)?x\.com\/[a-zA-Z0-9_]+\/status\/\d+/.test(url.trim());
    if (!isValidTweetUrl) {
      setInvalidUrl(true);
      setTweet(null);
      return;
    }

    setInvalidUrl(false);
    setLoading(true);
    setTweet(null);

    try {
      const res = await fetch(`https://r.jina.ai/${url.trim()}`);
      const md = await res.text();
      const { authorName, handle } = parseAuthor(md);
      const { content, timestamp, media } = parseTweet(md);

      const parsed = {
        authorName,
        handle,
        avatarUrl: `https://unavatar.io/x/${handle.replace("@", "")}`,
        verified: true,
        content,
        timestamp,
        media,
      };

      setTweet(parsed);
    } catch (err) {
      console.error("Failed to fetch tweet:", err);
      setTweet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExample = () => {
    const example = "https://x.com/SentientAGI/status/1956438251914637366";
    setUrl(example);
    setInvalidUrl(false);
  };

  return (
    <main className="min-h-[100vh] bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        {!tweet ? (
          <>
            {/* Header */}
            <header className="mb-8 sm:mb-10 text-center">
              <div className="mx-auto mb-3 flex h-[65px] w-[65px] items-center justify-center rounded-full">
                <img
                  src="\sentient.jpg"
                  alt="AI assistant avatar"
                  className="h-12 w-12 sm:h-[65px] sm:w-[65px] shrink-0 rounded-full bg-white shadow"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                Tweet Summarizer
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Paste an X (Twitter) link to summarize the tweet with Sentient
                Dobby 70B Model AI and get a clean summary.
              </p>
            </header>

            {/* Input */}
            <Card className="mx-auto mb-6 p-4 sm:p-6">
              <div className="mb-2 flex items-center gap-2">
                <label
                  htmlFor="tweet-url"
                  className="text-sm font-medium text-foreground"
                >
                  Tweet URL
                </label>
                <span className="text-xs text-muted-foreground">
                  (https://x.com/...)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    id="tweet-url"
                    inputMode="url"
                    placeholder="https://x.com/username/status/1234567890"
                    aria-invalid={invalidUrl}
                    aria-describedby={invalidUrl ? "url-error" : undefined}
                    className="pr-10"
                  />
                  {/^https?:\/\/(www\.)?x\.com\/[a-zA-Z0-9_]+\/status\/\d+/.test(
                    url.trim()
                  ) ? (
                    <Link2
                      className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-400"
                      onClick={() => window.open(url, "_blank")}
                    />
                  ) : (
                    <Link2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSummarize}
                    type="button"
                    disabled={loading}
                    className="whitespace-nowrap"
                  >
                    {loading ? "Loading..." : "Summarize"}
                    {!loading && <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={handleExample}
                    type="button"
                    variant="secondary"
                    disabled={loading}
                  >
                    Example
                  </Button>
                </div>
              </div>

              {invalidUrl && (
                <p
                  id="url-error"
                  role="alert"
                  className="mt-2 text-sm text-red-600"
                >
                  Please enter a valid X/Tweet URL.
                </p>
              )}
            </Card>
          </>
        ) : (
          <SummaryCard tweet={tweet} showSummary={setTweet} />
        )}
      </section>
    </main>
  );
}

export default TweetSummarize;
