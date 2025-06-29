
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

interface SearchCommandProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchCommand = ({ open, setOpen }: SearchCommandProps) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { suggestions, loading, searchProducts } = useSearchSuggestions(query);

  const handleSelect = async (value: string) => {
    setQuery(value);
    const results = await searchProducts(value);
    setOpen(false);
    
    // Navigate to products page with search results
    navigate('/products', { state: { searchResults: results, searchQuery: value } });
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const results = await searchProducts(query);
    setOpen(false);
    navigate('/products', { state: { searchResults: results, searchQuery: query } });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search medicines and healthcare products</DialogTitle>
      <Command className="rounded-lg border shadow-md" shouldFilter={false}>
        <CommandInput
          placeholder="Search medicines, healthcare products..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        {loading && (
          <div className="flex items-center justify-center px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Searching...</span>
          </div>
        )}
        <CommandList>
          <CommandEmpty>
            {query ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">No suggestions found</p>
                <Button onClick={handleSearch} size="sm">
                  Search for "{query}"
                </Button>
              </div>
            ) : (
              "Start typing to search..."
            )}
          </CommandEmpty>
          {suggestions.length > 0 && (
            <CommandGroup heading="Suggestions">
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.id}
                  value={suggestion.text}
                  onSelect={() => handleSelect(suggestion.text)}
                  className="cursor-pointer"
                >
                  <Search className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{suggestion.text}</span>
                    <span className="text-xs text-muted-foreground">by {suggestion.manufacturer}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
};

export default SearchCommand;
