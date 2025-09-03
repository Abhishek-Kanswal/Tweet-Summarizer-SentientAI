import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import TweetSummarize from "./pages/TweetSummarize";

export default function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<TweetSummarize />} />
    </Routes>
    </>
  );
}
