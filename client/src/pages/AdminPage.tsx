
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Post, Comment, Track } from '@shared/schema';
import UserList from '@/components/UserList';

interface AdminPageProps {}

export default function AdminPage({}: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPage, setTargetPage] = useState('new_music');
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, tracksRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/tracks')
      ]);
      setUsers(usersRes.data);
      setTracks(tracksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('page', targetPage);

    try {
      await axios.post('/api/upload/music', formData);
      setUploadStatus('File uploaded successfully!');
      fetchData(); // Refresh the track list
      setSelectedFile(null);
    } catch (error) {
      setUploadStatus('Failed to upload file');
      console.error('Upload error:', error);
    }
  };

  const handleDelete = async (trackId: number) => {
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      fetchData(); // Refresh the track list
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">File Upload</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block mb-2">Select File:</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".mp3,.mp4,.aac,.flac,.wav,.aiff,.avi,.wmv,.mov"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Target Page:</label>
            <select
              value={targetPage}
              onChange={(e) => setTargetPage(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="new_music">New Music</option>
              <option value="music_archive">Music Archive</option>
              <option value="blog">Blog</option>
              <option value="home">Home</option>
              <option value="about">About</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload
          </button>
          {uploadStatus && (
            <p className={uploadStatus.includes('success') ? 'text-green-500' : 'text-red-500'}>
              {uploadStatus}
            </p>
          )}
        </form>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">File Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Page</th>
                <th className="px-6 py-3 text-left">Upload Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="border-b dark:border-gray-600">
                  <td className="px-6 py-4">{track.title}</td>
                  <td className="px-6 py-4">{track.page || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {new Date(track.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tracks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No files available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Users</h2>
        <UserList users={users} />
      </section>
    </div>
  );
}
