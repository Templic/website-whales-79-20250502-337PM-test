import { useState } from 'react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminMusicUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState('new_music');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('page', page);

    try {
      await axios.post('/api/upload/music', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      toast({
        title: "Success",
        description: "File uploaded successfully"
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Upload Music</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Multimedia File
            <input
              type="file"
              accept=".mp3,.mp4,.aac,.flac,.wav,.aiff,.avi,.wmv,.mov"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full px-3 py-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
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
              className="mt-1 block w-full px-3 py-2 rounded bg-[rgba(48,52,54,0.5)] border-[#00ebd6]"
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
        <Button 
          type="submit" 
          disabled={isUploading}
          className="w-full bg-[#00ebd6] hover:bg-[#00ebd6]/80"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </form>
    </Card>
  );
}