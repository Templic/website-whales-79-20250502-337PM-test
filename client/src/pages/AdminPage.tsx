
import { useEffect, useState } from "react";
import axios from "axios";
import DeleteButton from "@/components/DeleteButton";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  approved: boolean;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  postId: number;
  approved: boolean;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [unapprovedPosts, setUnapprovedPosts] = useState<Post[]>([]);
  const [unapprovedComments, setUnapprovedComments] = useState<Comment[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPage, setTargetPage] = useState("new_music");

  useEffect(() => {
    document.title = "Admin - Dale Loves Whales";
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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('page', targetPage);

    try {
      await axios.post('/api/upload/music', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchData(); // Refresh the file list
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleDelete = async (trackId: number) => {
    try {
      await axios.delete(`/api/tracks/${trackId}`);
      fetchData(); // Refresh the file list
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-[#00ebd6] mb-8">Admin Dashboard</h1>

      {/* File Management Section */}
      <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">File Management</h2>
        
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="mb-6 space-y-4">
          <div>
            <label className="block text-[#00ebd6] mb-2">Upload File:</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".mp3,.mp4,.aac,.flac,.wav,.aiff,.avi,.wmv,.mov"
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00ebd6] file:text-[rgba(10,50,92,1)] hover:file:bg-[#00ebd6]/80"
            />
          </div>
          <div>
            <label className="block text-[#00ebd6] mb-2">Target Page:</label>
            <select
              value={targetPage}
              onChange={(e) => setTargetPage(e.target.value)}
              className="bg-[rgba(10,50,92,0.8)] text-white rounded p-2 w-full"
            >
              <option value="new_music">New Music Page</option>
              <option value="music_archive">Music Archive Page</option>
              <option value="blog">Blog Page</option>
              <option value="home">Home Page</option>
              <option value="about">About Page</option>
              <option value="newsletter">Newsletter Page</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-[#00ebd6] text-[rgba(10,50,92,1)] px-4 py-2 rounded hover:bg-[#00ebd6]/80"
          >
            Upload File
          </button>
        </form>

        {/* File List */}
        <div className="space-y-4">
          <h3 className="text-xl text-[#00ebd6]">Uploaded Files</h3>
          {tracks.map(track => (
            <div key={track.id} className="flex items-center justify-between bg-[rgba(10,50,92,0.8)] p-4 rounded">
              <div>
                <p className="text-white">{track.title}</p>
                <p className="text-sm text-gray-400">
                  Added: {new Date(track.createdAt).toLocaleDateString()}
                </p>
              </div>
              <DeleteButton onDelete={() => handleDelete(track.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* Other admin sections */}
      <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Users</h2>
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-[rgba(10,50,92,0.8)] p-4 rounded">
              <p className="text-white">{user.username} ({user.email})</p>
              <p className="text-sm text-gray-400">Role: {user.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-[#00ebd6] mb-4">Unapproved Content</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl text-[#00ebd6] mb-2">Posts</h3>
            {unapprovedPosts.map(post => (
              <div key={post.id} className="bg-[rgba(10,50,92,0.8)] p-4 rounded mb-2">
                <p className="text-white">{post.title}</p>
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-xl text-[#00ebd6] mb-2">Comments</h3>
            {unapprovedComments.map(comment => (
              <div key={comment.id} className="bg-[rgba(10,50,92,0.8)] p-4 rounded mb-2">
                <p className="text-white">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
