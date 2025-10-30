// Searcher.tsx
import { useState, useRef } from 'react';
import type { SearchResult } from '../types/types';

interface SearcherProps {
  uploadStatus: { message: string; type: 'loading' | 'success' | 'error' };
  searchResults: SearchResult[];
  onSearch: (query: string) => void;
  onSelectOwner: (owner: string, department: string) => void;
  onClearSearch: () => void;
}

export const Searcher = ({
  uploadStatus,
  searchResults,
  onSearch,
  onSelectOwner,
  onClearSearch
}: SearcherProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Limpiar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Establecer nuevo timeout para buscar después de que el usuario deje de escribir
    searchTimeout.current = setTimeout(() => {
      if (value.trim().length >= 2) {
        onSearch(value.trim());
      } else {
        onClearSearch();
      }
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onClearSearch();
  };

  const handleSearchClick = () => {
    if (searchQuery.trim().length >= 2) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <>
      <div className="status-section">
        <div className={`status-message ${uploadStatus.type}`}>
          {uploadStatus.message}
        </div>
      </div>
      
      <div className="search-section">
        <div className="card">
          <h3>Buscador de Propietarios</h3>
          <div className="search-container">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe el nombre del propietario o departamento..."
            />
            <button onClick={handleSearchClick}>Buscar</button>
            <button onClick={handleClearSearch}>Limpiar</button>
          </div>
          <div className="search-results">
            {searchResults.length === 0 && searchQuery.length >= 2 ? (
              <div className="no-results">No se encontraron propietarios</div>
            ) : (
              searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="search-result-item"
                  onClick={() => onSelectOwner(result.name, result.department)}
                >
                  <div className="search-result-name">{result.name}</div>
                  <div className="search-result-department">
                    {result.department} ({result.objectiveCount} objetivos)
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};