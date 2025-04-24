import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'wouter';

const SearchBar: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [searchType, setSearchType] = useState<'basic' | 'advanced'>('basic');

    const handleSearchTypeChange = useCallback((type: 'basic' | 'advanced') => {
        setSearchType(type);
    }, []);

    const searchBarClasses = useMemo(() => {
        return `search-bar ${isHovered ? 'hovered' : ''}`;
    }, [isHovered]);


    return (
        <div className={searchBarClasses} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {searchType === 'basic' ? (
                <div>
                    <input type="text" placeholder="Basic Search" />
                    <button>Search</button>
                </div>
            ) : (
                <div>
                    <input type="text" placeholder="Advanced Search" />
                    <button>Search</button>
                </div>
            )}
            <div>
                <button onClick={() => handleSearchTypeChange('basic')}>Basic</button>
                <button onClick={() => handleSearchTypeChange('advanced')}>Advanced</button>
            </div>
        </div>
    );
};

export default SearchBar;