"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

function parseAuthor(md) {
  let authorName = "";
  let handle = "";

  const nameMatch = md.match(/\[(.*?) !\[.*?\]\(.*?\)\]\(https:\/\/x\.com\/[a-zA-Z0-9_]+\)/);
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

export function TweetCard({ url, onLoaded, setTweetContent }) {
  const [tweet, setTweet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    async function fetchTweet() {
      try {
        const res = await fetch(`https://r.jina.ai/${url}`);
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
        setTweetContent(parsed);
        setLoading(false);
        if (onLoaded) onLoaded();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchTweet();
  }, [url]);

  if (!url) return null;

  return (
    <Card className="border bg-card text-card-foreground rounded-2xl shadow-sm max-w-xl mx-auto">
      {loading ? (
        <div className="p-6 text-center text-muted-foreground animate-pulse">
          Loading tweet...
        </div>
      ) : tweet ? (
        <div className="px-4 sm:px-5 py-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <img
              src={tweet.avatarUrl}
              alt={`${tweet.authorName} avatar`}
              className="h-10 w-10 rounded-full bg-muted object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold leading-none">{tweet.authorName}</span>
                {tweet.verified && <BadgeCheck className="h-4 w-4 text-sky-500" />}
              </div>
              <div className="text-xs text-muted-foreground">{tweet.handle}</div>
            </div>
          </div>

          {/* Content */}
          <div className="mt-3 text-[15px] leading-relaxed">
            <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{
                __html:
                  tweet.content.length > 280 && !expanded
                    ? tweet.content.slice(0, 280) + "..."
                    : tweet.content,
              }}
            />
            {tweet.content.length > 280 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-sm text-sky-500 hover:underline mt-1"
              >
                Show more
              </button>
            )}
          </div>

          {/* Media */}
          {tweet.media.length > 0 && (
            <div className={`mt-3 grid gap-1 ${tweet.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {tweet.media.map((src, i) =>
                src.endsWith(".mp4") || src.endsWith(".mov") ? (
                  <video key={i} src={src} controls className="rounded-lg object-cover w-full" />
                ) : (
                  <img key={i} src={src} alt={`Media ${i + 1}`} className="rounded-lg object-cover w-full" />
                )
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-3 text-xs text-muted-foreground">{tweet.timestamp}</div>
        </div>
      ) : (
        <div className="p-6 text-center text-red-500">Failed to load tweet</div>
      )}
    </Card>
  );
}