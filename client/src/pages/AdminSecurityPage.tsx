import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  ShieldCheck, 
  UserCog, 
  Settings, 
  LayoutDashboard 
} from 'lucide-react';
import SecurityDashboard from '@/components/admin/security/SecurityDashboard';
import SecurityConfig from '@/components/admin/security/SecurityConfig';
import UserSecurityManagement from '@/components/admin/security/UserSecurityManagement';

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Shield className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-4xl font-bold">Security Administration</h1>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="dashboard" className="flex items-center">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <UserCog className="h-4 w-4 mr-2" />
              User Security
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="dashboard">
          <SecurityDashboard />
        </TabsContent>
        
        <TabsContent value="config">
          <SecurityConfig />
        </TabsContent>
        
        <TabsContent value="users">
          <UserSecurityManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}