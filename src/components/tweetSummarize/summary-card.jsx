"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Copy, RefreshCw, Info } from "lucide-react";

export function SummaryCard({ tweet, showSummary }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [inputApiKey, setInputApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  const API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
  const MODEL =
    "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new";

  // Load env or saved API key
  useEffect(() => {
    if (typeof window !== "undefined") {
      const envKey = import.meta.env.VITE_FIREWORK_API_KEY || "";
      const savedKey = localStorage.getItem("API_KEY") || "";

      if (envKey) {
        setApiKey(envKey); // try env key first
      } else if (savedKey) {
        setApiKey(savedKey); // fallback to saved user key
      }
    }
  }, []);

  const askDobby = async (content) => {
    if (!apiKey) {
      setSummary("Missing API key. Add your Fireworks API key to proceed.");
      return;
    }

    setLoading(true);
    setSummary("");
    setDisplayText("");

    const payload = {
      model: MODEL,
      max_tokens: 700,
      temperature: 1,
      messages: [
        {
          role: "user",
          content: `Here is a tweet: ${content} 👉 Your tasks:
1. Summarize in **bullet points**  
2. Explain in simple terms  
3. Highlight main topic (crypto, tech, finance, etc)  
4. Add extra insights if relevant  
5. Format with **bold headings** + bullet points`,
        },
      ],
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 403) {
          // If env key failed, fallback to user key
          if (apiKey === import.meta.env.VITE_FIREWORK_API_KEY) {
            setApiKey(""); // force UI to ask user
          } else {
            localStorage.removeItem("API_KEY");
            setApiKey("");
          }
          throw new Error("API key invalid or expired");
        }
        throw new Error("API error: " + response.status);
      }

      const data = await response.json();

      const summaryText =
        data?.choices?.[0]?.message?.content?.trim() ||
        "No response. Please try again.";
      setSummary(summaryText);
    } catch (error) {
      setSummary("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Run when tweet or API key changes
  useEffect(() => {
    if (!tweet || !apiKey) return;

    const content = `author: ${tweet.authorName},
media: ${tweet.media.join(", ")},
content: ${tweet.content},
twitterHandle: ${tweet.handle},
timeStamps: ${tweet.timestamp}`;

    askDobby(content);
  }, [tweet, apiKey]);

  // Save user API key
  const handleSaveApiKey = () => {
    if (!inputApiKey) return;
    localStorage.setItem("API_KEY", inputApiKey);
    setApiKey(inputApiKey);
    setInputApiKey("");
  };

  // Typing animation
  useEffect(() => {
    if (!loading && summary) {
      let i = 0;
      setDisplayText("");
      const interval = setInterval(() => {
        setDisplayText(summary.slice(0, i + 1));
        i++;
        if (i >= summary.length) clearInterval(interval);
      }, 8);
      return () => clearInterval(interval);
    }
  }, [loading, summary]);

  // Copy
  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full items-start gap-3 sm:gap-4 bg-muted/50 shadow-sm border p-6 sm:p-8 rounded-2xl">
      {/* Top buttons */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => showSummary(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-background hover:bg-accent hover:text-accent-foreground text-foreground rounded-full border transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm sm:text-base font-medium">Back</span>
        </button>

        {!loading && summary && (
          <>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span className="text-sm">{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              onClick={() =>
                askDobby(
                  `author: ${tweet?.authorName}, content: ${tweet?.content}, twitterHandle: ${tweet?.handle}, timeStamps: ${tweet?.timestamp}`
                )
              }
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-accent transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Regenerate</span>
            </button>
          </>
        )}
      </div>

      {/* Chat content */}
      <div className="flex w-full items-start gap-3 sm:gap-4">
        <img
          src="/sentient.jpg"
          alt="AI assistant avatar"
          className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full bg-white shadow"
        />

        <div className="pr-5 py-1 sm:pr-5 sm:py-2 max-w-[90%] sm:max-w-[80%]">
          {!apiKey ? (
            <div className="mt-3 rounded-lg border p-3 bg-background">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
                <p className="text-sm text-foreground sm:mr-4">
                  Add your Fireworks API key to generate summaries
                </p>
                <button
                  onClick={() =>
                    window.open(
                      "https://app.fireworks.ai/settings/users/api-keys",
                      "_blank"
                    )
                  }
                  className="flex items-center gap-1 text-xs text-sky-500 hover:underline"
                >
                  <Info className="h-3.5 w-3.5" />
                  Fireworks API
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  placeholder="Enter Fireworks API key"
                  className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-3 py-2 rounded-md border hover:bg-accent text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
              <span>Summarizing</span>
              <div className="flex gap-1 pt-1.5">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.15s]">.</span>
                <span className="animate-bounce [animation-delay:0.3s]">.</span>
              </div>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                strong: ({ node, ...props }) => (
                  <strong
                    className="font-semibold text-foreground"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc pl-5 space-y-1 text-muted-foreground"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li
                    className="text-sm sm:text-base leading-relaxed"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-sm sm:text-base leading-relaxed text-muted-foreground mb-2"
                    {...props}
                  />
                ),
              }}
            >
              {displayText || summary}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}