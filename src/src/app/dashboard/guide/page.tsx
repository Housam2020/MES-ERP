"use client";

import { useRouter } from "next/navigation";
import { HomeIcon } from "@heroicons/react/24/outline";

export default function GuidesPage() {
  const router = useRouter();

  // YouTube video ID extracted from the link (e.g., "z-C6HFe31yA" from "https://www.youtube.com/watch?v=z-C6HFe31yA")
  const youtubeVideoId = "XuNeBVetBiw";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* Card Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[85vh] min-h-[600px] flex flex-col">
        {/* Header with Title and Home Icon */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Tutorial
          </h1>
          {/* Home Icon in the top right of the card */}
          <button
            onClick={() => router.push("/dashboard/home")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Go to Home"
          >
            <HomeIcon className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        {/* YouTube Video Embed */}
        <div className="flex-1 p-6">
          <div className="w-full h-full rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}