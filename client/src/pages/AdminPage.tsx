import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Post, Comment, Track } from '@shared/schema';
import UploadForm from '@/components/UploadForm';
import UserList from '@/components/UserList';

interface AdminPageProps {}

export default function AdminPage({}: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [unapprovedPosts, setUnapprovedPosts] = useState<Post[]>([]);
  const [unapprovedComments, setUnapprovedComments] = useState<Comment[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, postsRes, commentsRes, tracksRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/posts/unapproved'),
        axios.get('/api/posts/comments/unapproved'),
        axios.get('/api/tracks')
      ]);

      setUsers(usersRes.data);
      setUnapprovedPosts(postsRes.data);
      setUnapprovedComments(commentsRes.data);
      setTracks(tracksRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (trackId: number) => {
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      setTracks(tracks.filter(track => track.id !== trackId));
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Upload Music</h2>
        <UploadForm onUploadComplete={fetchData} />
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
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
                    No files uploaded yet
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