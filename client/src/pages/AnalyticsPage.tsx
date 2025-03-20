import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

// Define types for analytics data
interface AnalyticsData {
  activeUsers: number;
  activeUsersOverTime: number[];
  newRegistrations: number;
  newRegistrationsOverTime: number[];
  contentReports: number;
  contentDistribution: {
    posts: number;
    comments: number;
    tracks: number;
  };
  systemHealth: string;
  userRolesDistribution: {
    user: number;
    admin: number;
    super_admin: number;
  };
}

// Default color scheme
const colors = {
  primary: 'rgb(0, 235, 214)', // Teal color from the admin portal
  secondary: 'rgb(254, 0, 100)', // Pink as seen in the admin portal
  tertiary: 'rgb(255, 159, 64)', // Orange
  quaternary: 'rgb(54, 162, 235)', // Blue
  background: 'rgba(10, 50, 92, 0.6)', // Background from the admin portal
  textLight: '#fff',
  textDark: '#303436'
};

export default function AnalyticsPage() {
  const { user } = useAuth();

  // Check auth status
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Redirect to="/" />;
  }

  // Fetch analytics data with error handling
  const { 
    data: analyticsData = {} as AnalyticsData, 
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch
  } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics/detailed'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
    retry: 2,
    retryDelay: 1000
  });

  // Handle loading state
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  // Handle error state
  if (analyticsError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col space-y-4 mb-8">
          <Link href="/admin" className="flex items-center">
            <Button variant="ghost" className="text-[#00ebd6] hover:bg-[rgba(0,235,214,0.1)]">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Admin Portal
            </Button>
          </Link>
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Analytics</h1>
            <p className="text-gray-300 mb-4">There was a problem loading the analytics data.</p>
            <Button 
              onClick={() => refetch()} 
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const userActivityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Active Users',
        data: analyticsData.activeUsersOverTime || [0, 0, 0, 0, 0, 0],
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}33`, // with alpha
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const registrationsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Registrations',
        data: analyticsData.newRegistrationsOverTime || [0, 0, 0, 0, 0, 0],
        backgroundColor: colors.secondary,
        borderColor: `${colors.secondary}dd`, // with alpha
        borderWidth: 1,
      },
    ],
  };

  const contentDistributionData = {
    labels: ['Posts', 'Comments', 'Music Tracks'],
    datasets: [
      {
        data: analyticsData.contentDistribution ? 
          [
            analyticsData.contentDistribution.posts, 
            analyticsData.contentDistribution.comments, 
            analyticsData.contentDistribution.tracks
          ] : [0, 0, 0],
        backgroundColor: [
          colors.primary,
          colors.secondary,
          colors.tertiary,
        ],
        borderColor: [
          colors.textLight,
          colors.textLight,
          colors.textLight,
        ],
        borderWidth: 1,
      },
    ],
  };

  const userRolesData = {
    labels: ['Regular Users', 'Admins', 'Super Admins'],
    datasets: [
      {
        data: analyticsData.userRolesDistribution ? 
          [
            analyticsData.userRolesDistribution.user, 
            analyticsData.userRolesDistribution.admin, 
            analyticsData.userRolesDistribution.super_admin
          ] : [0, 0, 0],
        backgroundColor: [
          colors.quaternary,
          colors.primary,
          colors.secondary,
        ],
        borderColor: [
          colors.textLight,
          colors.textLight,
          colors.textLight,
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.textLight
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: colors.textLight
        },
        grid: {
          color: `${colors.textLight}22`
        }
      },
      x: {
        ticks: {
          color: colors.textLight
        },
        grid: {
          color: `${colors.textLight}22`
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: colors.textLight
        }
      }
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <Link href="/admin" className="flex items-center">
            <Button variant="ghost" className="text-[#00ebd6] hover:bg-[rgba(0,235,214,0.1)]">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Admin Portal
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-[#00ebd6]">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2">Comprehensive data insights and metrics for your application</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-lg text-gray-300 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-[#00ebd6]">
            {analyticsData?.activeUsers || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Users who logged in within last 24 hours
          </p>
        </div>
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-lg text-gray-300 mb-2">New Registrations</h3>
          <p className="text-3xl font-bold text-[#00ebd6]">
            {analyticsData?.newRegistrations || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Users who joined in the last 30 days
          </p>
        </div>
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-lg text-gray-300 mb-2">Content Reports</h3>
          <p className="text-3xl font-bold text-[#00ebd6]">
            {analyticsData?.contentReports || 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Content flagged by users or automated systems
          </p>
        </div>
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-lg text-gray-300 mb-2">System Health</h3>
          <p className="text-3xl font-bold text-[#00ebd6]">
            {analyticsData?.systemHealth || 'Good'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Overall platform performance status
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* User Activity Over Time */}
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-white">User Activity</h3>
          <p className="text-gray-400 text-sm mb-4">Monthly active user counts for the past 6 months</p>
          <div className="h-80">
            <Line data={userActivityData} options={chartOptions} />
          </div>
        </div>
        
        {/* New Registrations Over Time */}
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-white">New Registrations</h3>
          <p className="text-gray-400 text-sm mb-4">Monthly new user sign-ups for the past 6 months</p>
          <div className="h-80">
            <Bar data={registrationsData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Content Distribution */}
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-white">Content Distribution</h3>
          <p className="text-gray-400 text-sm mb-4">Breakdown of content types across the platform</p>
          <div className="h-80">
            <Pie data={contentDistributionData} options={pieOptions} />
          </div>
        </div>
        
        {/* User Roles Distribution */}
        <div className="bg-[rgba(10,50,92,0.6)] p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-2 text-white">User Roles</h3>
          <p className="text-gray-400 text-sm mb-4">Distribution of user access levels in the system</p>
          <div className="h-80">
            <Pie data={userRolesData} options={pieOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}