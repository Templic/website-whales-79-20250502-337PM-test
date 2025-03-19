
import React, { useState } from 'react';
import axios from 'axios';

export default function AdminMusicUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState('new_music');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page', page);

    try {
      await axios.post('/api/upload/music', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      // Could add success message/callback here
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Music File
          <input
            type="file"
            accept=".mp3,.mp4,.aac,.flac,.wav,.aiff,.avi,.wmv,.mov"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
            required
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Target Page
          <select
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          >
            <option value="new_music">New Music Page</option>
            <option value="music_archive">Music Archive Page</option>
            <option value="blog">Blog Page</option>
            <option value="home">Home Page</option>
            <option value="about">About Page</option>
            <option value="newsletter">Newsletter Page</option>
          </select>
        </label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload Music'}
      </button>
    </form>
  );
}
