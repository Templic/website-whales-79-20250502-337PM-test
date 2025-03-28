import { useEffect } from 'react';
import { SpotlightEffect } from '@/components/SpotlightEffect';

export default function TourPage() {
  useEffect(() => {
    document.title = "Tour - Dale Loves Whales";
  }, []);

  return (
    <>
      <SpotlightEffect />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-[#00ebd6] mb-6">Tour</h1>
        <div className="bg-[rgba(10,50,92,0.6)] p-8 rounded-xl shadow-lg">
          <p className="text-white">Tour dates coming soon!</p>
        </div>
      </div>
    </>
  );
}