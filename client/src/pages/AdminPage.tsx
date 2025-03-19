
import { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteButton from '@/components/DeleteButton';
import AdminMusicUpload from '@/components/AdminMusicUpload';
import { Track } from '@/types';

export default function AdminPage() {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const response = await axios.get('/api/tracks');
      setTracks(response.data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const handleTrackDeleted = () => {
    fetchTracks();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Upload Music</h2>
        <AdminMusicUpload />
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Manage Tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map(track => (
            <div key={track.id} className="border p-4 rounded-lg">
              <h3 className="font-bold">{track.title}</h3>
              <p className="text-gray-600">{track.artist}</p>
              <audio controls src={`/uploads/${track.audioUrl}`} className="mt-2 w-full" />
              <DeleteButton trackId={track.id} onDelete={handleTrackDeleted} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
