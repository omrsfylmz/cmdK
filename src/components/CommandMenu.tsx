import { Command } from 'cmdk';
import { Bookmark, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchResult {
  id: string;
  title: string;
  url: string;
}

const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<SearchResult[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      console.log('CmdK: Key pressed:', e.key, 'Meta:', e.metaKey, 'Ctrl:', e.ctrlKey);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === 'Escape') {
        if (e.key === 'Escape' && !open) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation(); // Critical for YouTube to stop its own handlers
        
        setOpen((open) => e.key === 'Escape' ? false : !open);
      }
    };

    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
  }, [open]);

  useEffect(() => {
    if (search.length > 0) {
      chrome.runtime.sendMessage({ type: 'SEARCH_BOOKMARKS', query: search }, (response) => {
        if (response) {
          setItems(response);
        }
      });
    } else {
        setItems([]);
    }
  }, [search]);

  // Handle opening URL
  const handleSelect = (url: string) => {
    setOpen(false);
    window.location.href = url;
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/50 p-[16px] font-sans backdrop-blur-sm pt-[20vh]"
      onClick={handleBackdropClick}
    >
      <Command shouldFilter={false} className="w-full max-w-[640px] overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl text-white">
        <div className="flex items-center border-b border-gray-700 px-[16px]" cmdk-input-wrapper="">
          <Search className="mr-[12px] h-[24px] w-[24px] shrink-0 text-gray-400" />
          <Command.Input
            className="flex h-[64px] w-full rounded-md bg-transparent py-[16px] text-[18px] outline-none placeholder:text-gray-500 text-white"
            placeholder="Search bookmarks or type to Google..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
        </div>
        <Command.List className="max-h-[400px] overflow-y-auto p-[12px] scroll-py-[12px]">
          <Command.Empty className="py-[32px] text-center text-gray-500 text-[16px]">
            No results found.
          </Command.Empty>
          
          {items.length > 0 && (
            <Command.Group heading="Bookmarks" className="text-gray-400 text-[12px] font-semibold mb-[8px] px-[8px] uppercase tracking-wider">
              {items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.url)}
                  className="relative flex cursor-default select-none items-center rounded-lg px-[12px] py-[12px] text-[16px] outline-none aria-selected:bg-gray-800 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-gray-300 transition-colors"
                >
                  <Bookmark className="mr-[12px] h-[20px] w-[20px] text-blue-400" />
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto text-[12px] text-gray-500 truncate max-w-[200px]">{item.url}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {search.length > 0 && (
            <Command.Group heading="Web Search" className="text-gray-400 text-[12px] font-semibold mb-[8px] px-[8px] uppercase tracking-wider mt-[16px]">
              <Command.Item
                value={`google-${search}`}
                onSelect={() => {
                  setOpen(false);
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(search)}`, '_blank');
                }}
                className="relative flex cursor-default select-none items-center rounded-lg px-[12px] py-[12px] text-[16px] outline-none aria-selected:bg-gray-800 aria-selected:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-gray-300 transition-colors"
                >
                  <Search className="mr-[12px] h-[20px] w-[20px] text-green-400" />
                  <span className="truncate">Search on Google for <span className="text-white font-medium">"{search}"</span></span>
              </Command.Item>
            </Command.Group>
          )}

           {items.length === 0 && search.length === 0 && (
            <div className="p-[32px] text-center text-gray-500 text-[16px]">
                Type to search your bookmarks...
            </div>
           )}
        </Command.List>
      </Command>
    </div>
  );
};

export default CommandMenu;
