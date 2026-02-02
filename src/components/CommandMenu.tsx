import { Command } from 'cmdk';
import { Bookmark, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

interface SearchResult {
  id: string;
  title: string;
  url: string;
}

// Assuming BookmarkItem is similar to SearchResult or will be defined elsewhere
type BookmarkItem = SearchResult;

const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    // Listen for Cmd+K
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
    if (open) {
      try {
        if (chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, (response) => {
            if (chrome.runtime.lastError) {
              const msg = JSON.stringify(chrome.runtime.lastError);
              if (msg.includes('invalidated') || msg.includes('message port closed')) {
                 console.log('CmdK: Extension context invalidated (Reload detected). Please refresh the page.');
              } else {
                 console.warn('CmdK: Runtime error (GET_BOOKMARKS):', msg);
              }
              return;
            }
            if (response) {
              setItems(response);
            }
          });
        } else {
            console.log('CmdK: Extension updated or context invalidated. Please refresh the page to reconnect.');
            setItems([]); 
        }
      } catch (error: any) {
        if (error.message?.includes('invalidated') || error.message?.includes('Extension context')) {
             console.log('CmdK: Extension context invalidated. Please refresh the page.');
        } else {
             console.warn('CmdK: Exception in GET_BOOKMARKS:', error);
        }
      }
    }
  }, [open]);

  useEffect(() => {
    try {
        const isRuntimeAvailable = chrome?.runtime?.sendMessage;
        
        if (search.length > 0 && isRuntimeAvailable) {
            chrome.runtime.sendMessage({ type: 'SEARCH_BOOKMARKS', query: search }, (response) => {
                if (chrome.runtime.lastError) {
                     // Suppress "Extension context invalidated" noise
                     console.warn('CmdK: Runtime error (SEARCH):', JSON.stringify(chrome.runtime.lastError));
                     return;
                }
                if (response) {
                    setItems(response);
                }
            });
        } else if (open && isRuntimeAvailable) { 
             chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, (response) => {
                if (chrome.runtime.lastError) {
                    return;
                }
                if (response) {
                    setItems(response);
                }
            });
        }
    } catch (e) {
        console.warn('CmdK: Exception in Search/Open effect:', e);
    }
  }, [search, open]);

  // Handle opening URL
  const handleSelect = (url: string) => {
    setOpen(false);
    window.location.href = url;
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      <Command shouldFilter={false} className="w-full max-w-[640px] overflow-hidden rounded-xl border border-[#333] bg-[#0d1117] shadow-2xl text-gray-200 antialiased font-sans">
        <div className="flex items-center border-b border-[#333] px-[16px] relative" cmdk-input-wrapper="">
          <img src={logo} alt="CmdK Logo" className="mr-[12px] h-[28px] w-[28px] shrink-0 rounded-md" />
          <Command.Input
            className="flex h-[60px] w-full bg-transparent py-[16px] text-[16px] outline-none placeholder:text-gray-600 text-gray-200"
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-[#333] bg-[#161b22] px-1.5 font-mono text-[10px] font-medium text-gray-500 opacity-100">
               <span className="text-xs">ESC</span>
            </kbd>
          </div>
        </div>
        
        <Command.List className="max-h-[400px] overflow-y-auto p-[8px] scroll-py-[8px]">
          <Command.Empty className="py-[32px] text-center text-gray-500 text-[14px]">
            No results found.
          </Command.Empty>
          
          {items.length > 0 && (
            <Command.Group heading="Bookmarks" className="text-gray-500 text-[11px] font-medium mb-[8px] px-[8px] mt-[8px] uppercase tracking-wider">
              {items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={item.title}
                  onSelect={() => handleSelect(item.url)}
                  className="group relative flex cursor-pointer select-none items-center rounded-md px-[12px] py-[12px] text-[14px] outline-none data-[selected='true']:bg-[#161b22] data-[selected='true']:text-white text-gray-400 transition-all duration-200 border-l-2 border-transparent data-[selected='true']:border-blue-500"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f242e] mr-3 group-data-[selected=true]:bg-blue-500/10 group-data-[selected=true]:text-blue-400">
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-medium text-gray-300 group-data-[selected=true]:text-white">{item.title}</span>
                    <span className="truncate text-[11px] text-gray-600 group-data-[selected=true]:text-gray-500">{item.url}</span>
                  </div>
                  <span className="ml-auto text-[11px] text-gray-600 group-data-[selected=true]:text-gray-500 hidden sm:inline-block">Jump</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {search.length > 0 && (
            <Command.Group heading="Web Search" className="text-gray-500 text-[11px] font-medium mb-[8px] px-[8px] mt-[16px] uppercase tracking-wider">
              <Command.Item
                value={`google-${search}`}
                onSelect={() => {
                  setOpen(false);
                  window.open(`https://www.google.com/search?q=${encodeURIComponent(search)}`, '_blank');
                }}
                 className="group relative flex cursor-pointer select-none items-center rounded-md px-[12px] py-[12px] text-[14px] outline-none data-[selected='true']:bg-[#161b22] data-[selected='true']:text-white text-gray-400 transition-all duration-200 border-l-2 border-transparent data-[selected='true']:border-green-500"
                >
                   <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f242e] mr-3 group-data-[selected=true]:bg-green-500/10 group-data-[selected=true]:text-green-400">
                      <Search className="h-4 w-4" />
                   </div>
                  <span className="truncate font-medium text-gray-300 group-data-[selected=true]:text-white">Search Google for <span className="text-white font-bold">"{search}"</span></span>
                  <div className="ml-auto flex items-center gap-1">
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-[#333] bg-[#21262d] px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100">
                        ↩
                    </kbd>
                  </div>
              </Command.Item>
            </Command.Group>
          )}

           {items.length === 0 && search.length === 0 && (
            <div className="flex flex-col items-center justify-center py-[48px] text-center text-gray-500">
                <p className="text-[14px]">Type to search bookmarks...</p>
                <div className="mt-4 flex gap-2">
                    <span className="px-2 py-1 rounded bg-[#161b22] text-[11px] text-gray-400 border border-[#333]">CMD + K</span>
                    <span className="px-2 py-1 rounded bg-[#161b22] text-[11px] text-gray-400 border border-[#333]">ESC</span>
                </div>
            </div>
           )}
        </Command.List>

        <div className="border-t border-[#333] bg-[#161b22] px-[16px] py-[8px] flex justify-between items-center">
            <div className="flex gap-4 text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                    <kbd className="h-4 w-4 flex items-center justify-center rounded bg-[#21262d] border border-[#333]">↓</kbd> 
                    <kbd className="h-4 w-4 flex items-center justify-center rounded bg-[#21262d] border border-[#333]">↑</kbd> 
                    <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                    <kbd className="h-4 px-1 flex items-center justify-center rounded bg-[#21262d] border border-[#333]">↵</kbd> 
                    <span>Select</span>
                </span>
            </div>
            <div className="text-[11px] text-gray-600">
                CmdK Extension
            </div>
        </div>

      </Command>
    </div>
  );
};

export default CommandMenu;
