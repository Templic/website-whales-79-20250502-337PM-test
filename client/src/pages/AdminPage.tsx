import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Track } from '@shared/schema';
import UserList from '@/components/UserList';
import AdminMusicUpload from '@/components/AdminMusicUpload';
import DeleteButton from '@/components/DeleteButton';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminPageProps {}

export default function AdminPage({}: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, tracksRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/tracks')
      ]);
      console.log('Tracks API Response:', tracksRes.data); // Debug log
      setUsers(usersRes.data);
      setTracks(tracksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    }
  };

  const handleTrackDeleted = () => {
    fetchData(); // Refresh the track list after deletion
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <section>
        <h2 className="text-2xl font-semibold mb-4">File Upload</h2>
        <AdminMusicUpload onUploadSuccess={fetchData} />
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">File Management</h2>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-md border">
            <Table>
              <TableCaption>A list of all uploaded multimedia files</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>File Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No files available
                    </TableCell>
                  </TableRow>
                ) : (
                  tracks.map((track) => (
                    <TableRow key={track.id}>
                      <TableCell className="font-medium">{track.title}</TableCell>
                      <TableCell>{track.page || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(track.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{track.fileType || 'Unknown'}</TableCell>
                      <TableCell className="text-right">
                        <DeleteButton 
                          trackId={track.id} 
                          onDelete={handleTrackDeleted}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <UserList users={users} />
        </Card>
      </section>
    </div>
  );
}