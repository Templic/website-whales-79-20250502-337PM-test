import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
// Assuming Button and Card components are defined elsewhere
import { Button, Card, Input, Badge } from './components'; // Adjust path as needed


interface Newsletter {
  id: number;
  title: string;
  content: string;
  sentDate: string;
  status: 'draft' | 'sent';
}

interface Subscriber {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export default function NewsletterManagement() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'newsletters'>('subscribers');
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);

  const createNewsletterMutation = useMutation({
    mutationFn: async (data: Partial<Newsletter>) => {
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create newsletter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      setEditingNewsletter(null);
    },
  });

  const sendNewsletterMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/newsletters/${id}/send`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to send newsletter');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
    },
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(subscribers || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
    XLSX.writeFile(wb, "newsletter_subscribers.xlsx");
  };

  //Fetch Data (replace with your actual data fetching logic)
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null);
  const [newsletters, setNewsletters] = useState<Newsletter[] | null>(null);

  //Simulate fetching data
  React.useEffect(() => {
    const fetchSubscribers = async () => {
      const res = await fetch('/api/subscribers');
      const data = await res.json();
      setSubscribers(data);
    }
    const fetchNewsletters = async () => {
      const res = await fetch('/api/newsletters');
      const data = await res.json();
      setNewsletters(data);
    }
    fetchSubscribers();
    fetchNewsletters();

  }, []);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Newsletter Management</h2>
        <div className="space-x-2">
          <Button 
            variant={activeTab === 'subscribers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('subscribers')}
          >
            Subscribers
          </Button>
          <Button 
            variant={activeTab === 'newsletters' ? 'default' : 'outline'}
            onClick={() => setActiveTab('newsletters')}
          >
            Newsletters
          </Button>
          {activeTab === 'subscribers' && (
            <Button onClick={exportToExcel}>
              Export to Excel
            </Button>
          )}
        </div>
      </div>
      {activeTab === 'subscribers' ? (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Subscribers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {subscribers?.map((subscriber) => (
                  <tr key={subscriber.id}>
                    <td>{subscriber.name}</td>
                    <td>{subscriber.email}</td>
                    <td>{subscriber.createdAt}</td>
                    <td>{subscriber.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Newsletters</h3>
            <Button 
              onClick={() => setEditingNewsletter({ 
                id: 0, 
                title: '', 
                content: '', 
                sentDate: '', 
                status: 'draft' 
              })}
            >
              Create New
            </Button>
          </div>

          {editingNewsletter ? (
            <div className="space-y-4">
              <Input
                placeholder="Newsletter Title"
                value={editingNewsletter.title}
                onChange={(e) => setEditingNewsletter({
                  ...editingNewsletter,
                  title: e.target.value
                })}
              />
              <textarea
                className="w-full h-64 p-2 border rounded"
                placeholder="Newsletter Content"
                value={editingNewsletter.content}
                onChange={(e) => setEditingNewsletter({
                  ...editingNewsletter,
                  content: e.target.value
                })}
              />
              <div className="space-x-2">
                <Button 
                  onClick={() => createNewsletterMutation.mutate(editingNewsletter)}
                >
                  Save
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditingNewsletter(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {newsletters?.map((newsletter) => (
                <div key={newsletter.id} className="border p-4 rounded">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{newsletter.title}</h4>
                    <Badge>{newsletter.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{newsletter.content.substring(0, 100)}...</p>
                  <div className="mt-4 space-x-2">
                    {newsletter.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => sendNewsletterMutation.mutate(newsletter.id)}
                      >
                        Send
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingNewsletter(newsletter)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}