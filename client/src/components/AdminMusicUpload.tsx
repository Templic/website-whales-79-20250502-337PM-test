
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminMusicUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState('new_music');
  const [isUploading, setIsUploading] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Fetch CSRF token on component mount
    axios.get('/api/csrf-token')
      .then(response => setCsrfToken(response.data.csrfToken))
      .catch(error => console.error('Failed to fetch CSRF token:', error));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('page', page);

      const response = await axios.post('/api/upload/music', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'CSRF-Token': csrfToken
        }
      });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      // Reset form
      setFile(null);
      setPage('new_music');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }

    try {
      await axios.post('/api/upload/music', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'CSRF-Token': csrfToken
        }
      });
      setFile(null);
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Upload Music File:</label>
          <input
            type="file"
            accept=".mp3,.mp4,.aac,.flac,.wav,.aiff,.avi,.wmv,.mov"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Target Page:</label>
          <select 
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="new_music">New Music</option>
            <option value="music_archive">Music Archive</option>
          </select>
        </div>
        <Button 
          type="submit" 
          disabled={isUploading || !file}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Music'}
        </Button>
      </form>
    </Card>
  );
}
