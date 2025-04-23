/**
 * UserSearchComponent.tsx
 * 
 * A specialized search component for the admin section that allows
 * searching users with dropdown results
 */

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, User, Mail, Calendar, Shield, XCircle } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: string;
  updatedAt: string | null;
  isBanned?: boolean;
  profileImage?: string;
}

interface UserSearchComponentProps {
  onResultClick?: (user: User) => void;
  className?: string;
  placeholder?: string;
  // Function to be called when search input changes
  onSearchChange?: (value: string) => void;
  // If true, the popover and dropdown results won't be displayed
  simpleMode?: boolean;
}

export default function UserSearchComponent({
  onResultClick,
  className = '',
  placeholder = 'Search users...',
  onSearchChange,
  simpleMode = false
}: UserSearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<'all' | 'username' | 'email' | 'role'>('all');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search function with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If onSearchChange is provided, call it with the current value
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }

    // If in simple mode, don't perform the search
    if (simpleMode) {
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        // Call the API with filters
        const response = await axios.get('/api/admin/users/search', {
          params: {
            q: searchQuery,
            filter: searchFilter !== 'all' ? searchFilter : undefined
          }
        });
        
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery, searchFilter, onSearchChange, simpleMode]);

  // Handle clicking a search result
  const handleResultClick = (user: User) => {
    // Close the popover
    setOpen(false);
    
    // If a callback was provided, use it
    if (onResultClick) {
      onResultClick(user);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In simple mode, just call onSearchChange
    if (simpleMode && onSearchChange) {
      onSearchChange(searchQuery);
      return;
    }
  };

  // Get the highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-blue-500/20 text-blue-300">{part}</span> : part
    );
  };

  // Get role color based on role
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        {simpleMode ? (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10 py-2 w-full"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-10 py-2 w-full bg-black/30 focus:bg-black/40 transition-colors border-blue-700/30 focus:border-blue-500/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                    onClick={() => setSearchQuery('')}
                    type="button"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] overflow-auto" 
              align="start"
            >
              <Command className="rounded-lg border-0">
                <div className="px-3 pt-3 pb-1">
                  <Tabs defaultValue={searchFilter} onValueChange={(v: any) => setSearchFilter(v)} className="w-full">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="username" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Username
                      </TabsTrigger>
                      <TabsTrigger value="email" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="role" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Role
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <CommandInput
                  placeholder="Type to search users..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="border-b-0"
                />
                <CommandList>
                  {loading ? (
                    <div className="py-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Searching users...</p>
                    </div>
                  ) : (
                    <>
                      <CommandEmpty className="py-6 text-center">
                        <p>No users found for "{searchQuery}"</p>
                        <p className="text-sm text-muted-foreground mt-1">Try a different search term or filter</p>
                      </CommandEmpty>

                      {searchResults.length > 0 && (
                        <CommandGroup heading="Users">
                          {searchResults.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`user-${user.id}`}
                              className="py-2 cursor-pointer"
                              onSelect={() => handleResultClick(user)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="h-9 w-9">
                                  {user.profileImage ? (
                                    <AvatarImage src={user.profileImage} alt={user.username} />
                                  ) : null}
                                  <AvatarFallback>
                                    {user.username.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">
                                      {highlightMatch(user.username, searchQuery)}
                                    </p>
                                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize text-xs">
                                      {user.role.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex flex-col mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {highlightMatch(user.email, searchQuery)}
                                    </span>
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs flex items-center gap-1">
                                        <Calendar className="h-3 w-3 opacity-70" />
                                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                      </span>
                                      
                                      {user.isBanned && (
                                        <Badge variant="destructive" className="text-xs">Banned</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <Button type="submit" className="sr-only">Search</Button>
    </form>
  );
}