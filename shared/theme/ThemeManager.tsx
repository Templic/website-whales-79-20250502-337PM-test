/**
 * Theme Manager Component
 * 
 * This component provides a user interface for managing themes,
 * including selecting themes, customizing settings, and creating new themes.
 */

import React, { useState, useEffect } from 'react';
import { ThemePreviewPanel } from './ThemePreviewPanel';
import { themeAPI } from './api';
import { useTheme } from './ThemeContext';
import { ThemeTokens } from './types';
import { baseTokens } from './tokens';

export interface ThemeListItem {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  previewImageUrl?: string;
  updatedAt: string;
  tags?: string[];
}

export interface ThemeDetailItem extends ThemeListItem {
  tokens: ThemeTokens;
}

export interface ThemeManagerProps {
  onSelectTheme?: (themeId: number, tokens: ThemeTokens) => void;
  onThemeChange?: (tokens: ThemeTokens) => void;
  allowCreate?: boolean;
  allowImport?: boolean;
  showPreview?: boolean;
  previewOnly?: boolean;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({
  onSelectTheme,
  onThemeChange,
  allowCreate = true,
  allowImport = true,
  showPreview = true,
  previewOnly = false,
}) => {
  const { mode, setMode, contrast, setContrast, motion, setMotion } = useTheme();
  
  // State for theme list and selection
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for user preferences
  const [currentThemeId, setCurrentThemeId] = useState<number | null>(null);
  const [currentThemeMode, setCurrentThemeMode] = useState(mode);
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalThemes, setTotalThemes] = useState(0);
  
  // State for search and filtering
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  // State for import/export modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [exportText, setExportText] = useState('');
  
  // Fetch themes on mount and when filters change
  useEffect(() => {
    fetchThemes();
  }, [page, search, selectedTags, showOnlyMine]);
  
  // Fetch current user theme on mount
  useEffect(() => {
    fetchCurrentUserTheme();
  }, []);
  
  // Fetch themes from API
  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await themeAPI.listThemes({
        page,
        pageSize: 12,
        search: search || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        onlyMine: showOnlyMine,
        sortBy: 'updatedAt',
        sortDirection: 'desc',
      });
      
      setThemes(result.themes);
      setTotalPages(result.pages);
      setTotalThemes(result.total);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching themes:', error);
      setError('Failed to load themes. Please try again.');
      setLoading(false);
    }
  };
  
  // Fetch current user theme from API
  const fetchCurrentUserTheme = async () => {
    try {
      const userTheme = await themeAPI.getCurrentUserTheme();
      
      // Update context with user preferences
      setMode(userTheme.themeMode);
      setContrast(userTheme.themeContrast);
      setMotion(userTheme.themeMotion);
      
      // Update local state
      setCurrentThemeId(userTheme.themeId || null);
      setCurrentThemeMode(userTheme.themeMode);
      
      // If a theme is selected, fetch its details
      if (userTheme.themeId) {
        fetchThemeDetails(userTheme.themeId);
      }
    } catch (error) {
      console.error('Error fetching current user theme:', error);
    }
  };
  
  // Fetch theme details from API
  const fetchThemeDetails = async (themeId: number) => {
    try {
      setLoading(true);
      
      const themeData = await themeAPI.getTheme(themeId);
      
      if (themeData) {
        setSelectedTheme({
          ...themeData.theme,
          tokens: themeData.tokens,
        });
        
        // Notify parent component
        onThemeChange?.(themeData.tokens);
      }
      
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching theme details for ${themeId}:`, error);
      setError('Failed to load theme details. Please try again.');
      setLoading(false);
    }
  };
  
  // Select a theme
  const handleSelectTheme = async (themeId: number) => {
    // Fetch theme details
    await fetchThemeDetails(themeId);
    
    // Update user preferences
    try {
      await themeAPI.setThemePreferences({
        themeId,
      });
      
      setCurrentThemeId(themeId);
      
      // Notify parent component
      onSelectTheme?.(themeId, selectedTheme?.tokens || baseTokens);
    } catch (error) {
      console.error('Error setting theme preferences:', error);
      setError('Failed to select theme. Please try again.');
    }
  };
  
  // Create a new theme
  const handleCreateTheme = async (name: string, description?: string, isPublic = false) => {
    try {
      // Start with base tokens or selected theme tokens
      const baseTokens = selectedTheme?.tokens || baseTokens;
      
      const newTheme = await themeAPI.createTheme({
        name,
        description,
        isPublic,
        tokens: baseTokens,
      });
      
      // Refresh themes list
      fetchThemes();
      
      // Select the new theme
      handleSelectTheme(newTheme.id);
      
      return newTheme.id;
    } catch (error) {
      console.error('Error creating theme:', error);
      setError('Failed to create theme. Please try again.');
      return null;
    }
  };
  
  // Import a theme
  const handleImportTheme = async () => {
    try {
      if (!importText) {
        setError('Please enter theme data to import.');
        return;
      }
      
      const newTheme = await themeAPI.importTheme(importText, false);
      
      // Close modal
      setImportModalOpen(false);
      setImportText('');
      
      // Refresh themes list
      fetchThemes();
      
      // Select the new theme
      handleSelectTheme(newTheme.id);
      
      return newTheme.id;
    } catch (error) {
      console.error('Error importing theme:', error);
      setError('Failed to import theme. Invalid format or data.');
      return null;
    }
  };
  
  // Export a theme
  const handleExportTheme = async (themeId: number) => {
    try {
      if (!themeId) {
        setError('No theme selected for export.');
        return;
      }
      
      const exportData = await themeAPI.exportTheme(themeId);
      
      // Set export text and open modal
      setExportText(JSON.stringify(exportData, null, 2));
      setExportModalOpen(true);
    } catch (error) {
      console.error('Error exporting theme:', error);
      setError('Failed to export theme. Please try again.');
    }
  };
  
  // Change theme mode
  const handleThemeModeChange = async (newMode: string) => {
    try {
      await themeAPI.setThemePreferences({
        themeMode: newMode as any,
      });
      
      // Update context
      setMode(newMode as any);
      
      // Update local state
      setCurrentThemeMode(newMode as any);
    } catch (error) {
      console.error('Error setting theme mode:', error);
      setError('Failed to change theme mode. Please try again.');
    }
  };
  
  // Change contrast setting
  const handleContrastChange = async (newContrast: string) => {
    try {
      await themeAPI.setThemePreferences({
        themeContrast: newContrast as any,
      });
      
      // Update context
      setContrast(newContrast as any);
    } catch (error) {
      console.error('Error setting contrast:', error);
      setError('Failed to change contrast. Please try again.');
    }
  };
  
  // Change motion setting
  const handleMotionChange = async (newMotion: string) => {
    try {
      await themeAPI.setThemePreferences({
        themeMotion: newMotion as any,
      });
      
      // Update context
      setMotion(newMotion as any);
    } catch (error) {
      console.error('Error setting motion:', error);
      setError('Failed to change motion preference. Please try again.');
    }
  };
  
  // Pagination handlers
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Search handler
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };
  
  // Tag selection handler
  const handleTagSelect = (tag: string) => {
    // Toggle tag selection
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    
    setPage(1); // Reset to first page on filter change
  };
  
  // Toggle "Only Mine" filter
  const handleToggleOnlyMine = () => {
    setShowOnlyMine(!showOnlyMine);
    setPage(1); // Reset to first page on filter change
  };
  
  // Get all unique tags from themes
  const allTags = Array.from(new Set(
    themes.flatMap(theme => theme.tags || [])
  )).sort();
  
  return (
    <div className="theme-manager-container">
      {/* Header and Filters */}
      <div className="theme-manager-header">
        <h2 className="text-xl font-semibold mb-4">Theme Manager</h2>
        
        {!previewOnly && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search themes..."
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  &times;
                </button>
              )}
            </div>
            
            {/* Filter by mine */}
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyMine}
                onChange={handleToggleOnlyMine}
                className="sr-only"
              />
              <span className={`relative inline-block w-10 h-5 rounded-full transition-colors ${showOnlyMine ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span
                  className={`absolute inset-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showOnlyMine ? 'transform translate-x-5' : ''}`}
                />
              </span>
              <span className="ml-2 text-sm">My Themes Only</span>
            </label>
            
            {/* Create/Import buttons */}
            {(allowCreate || allowImport) && (
              <div className="flex space-x-2 ml-auto">
                {allowCreate && (
                  <button
                    onClick={() => handleCreateTheme('New Theme', 'My custom theme')}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Create Theme
                  </button>
                )}
                
                {allowImport && (
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Import
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Tags */}
        {!previewOnly && allTags.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Filter by tags:</div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary/80 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Theme list */}
        {!previewOnly && (
          <div className="lg:w-1/2 xl:w-3/5">
            {loading && !selectedTheme ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
                {error}
              </div>
            ) : themes.length === 0 ? (
              <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-md text-center">
                <p className="text-gray-600 dark:text-gray-300">No themes found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {search || selectedTags.length > 0 
                    ? 'Try adjusting your search or filters'
                    : 'Create a new theme or import one to get started'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        currentThemeId === theme.id 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {theme.previewImageUrl ? (
                        <div 
                          className="h-32 w-full bg-cover bg-center rounded-md mb-3"
                          style={{ backgroundImage: `url(${theme.previewImageUrl})` }}
                        />
                      ) : (
                        <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md mb-3" />
                      )}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-base">{theme.name}</h3>
                          {theme.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {theme.description}
                            </p>
                          )}
                        </div>
                        {currentThemeId === theme.id && (
                          <div className="bg-primary text-white text-xs px-1.5 py-0.5 rounded">
                            Active
                          </div>
                        )}
                      </div>
                      {theme.tags && theme.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {theme.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagSelect(tag);
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {new Date(theme.updatedAt).toLocaleDateString()}
                        </span>
                        {theme.isPublic && (
                          <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {totalThemes} theme{totalThemes !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={page === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        page === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      &larr;
                    </button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        page === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Theme preview */}
        {showPreview && (selectedTheme || previewOnly) && (
          <div className="lg:w-1/2 xl:w-2/5">
            <div className="sticky top-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-base">
                    {selectedTheme?.name || 'Theme Preview'}
                  </h3>
                  {selectedTheme?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {selectedTheme.description}
                    </p>
                  )}
                </div>
                
                <div className="p-4">
                  <ThemePreviewPanel
                    tokens={selectedTheme?.tokens || baseTokens}
                    variant={previewOnly ? 'expanded' : 'default'}
                    showTokenValues={true}
                  />
                </div>
                
                {selectedTheme && !previewOnly && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleExportTheme(selectedTheme.id)}
                      className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Export
                    </button>
                    <button
                      onClick={() => handleSelectTheme(selectedTheme.id)}
                      className={`px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 ${
                        currentThemeId === selectedTheme.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={currentThemeId === selectedTheme.id}
                    >
                      {currentThemeId === selectedTheme.id ? 'Active Theme' : 'Apply Theme'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Import Theme Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-medium mb-4">Import Theme</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Paste the theme JSON data below:
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
              placeholder='{"name": "Theme Name", "tokens": {...}}'
            />
            {error && (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportText('');
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTheme}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Theme Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 p-6">
            <h3 className="text-lg font-medium mb-4">Export Theme</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Copy the theme JSON data below:
            </p>
            <textarea
              value={exportText}
              readOnly
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setExportModalOpen(false);
                  setExportText('');
                }}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};