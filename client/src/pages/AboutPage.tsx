import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About - Dale Loves Whales";
  }, []);

  return (
    <div className="space-y-8">
      {/* About page content */}
    </div>
  );
}