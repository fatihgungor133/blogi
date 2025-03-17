import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "./ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import type { Content } from "@shared/schema";
import { Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeaderProps {
  siteName?: string;
}

export function Header({ siteName = 'Blog İçerik Tarayıcısı' }: HeaderProps) {
  const displaySiteName = siteName && siteName.trim() !== '' 
    ? siteName 
    : 'Blog İçerik Tarayıcısı';
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const isMobile = useIsMobile();

  const { data: searchResults } = useQuery<Content[]>({
    queryKey: ['/api/search', debouncedSearch],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`).then(res => res.json()),
    enabled: debouncedSearch.length > 2
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSearchOpen(debouncedSearch.length > 2 && (searchResults?.length ?? 0) > 0);
  }, [debouncedSearch, searchResults]);

  const handleSearchResultClick = () => {
    setIsSearchOpen(false);
    setSearchTerm("");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-screen-xl mx-auto px-4 flex h-16 items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <span className="text-xl font-bold text-primary">{displaySiteName}</span>
          </div>
        </Link>

        <nav className="ml-8 flex items-center space-x-6">
          <Link href="/">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">Ana Sayfa</span>
          </Link>
          <Link href="/popular">
            <span className="text-sm font-medium hover:text-primary cursor-pointer">Popüler İçerikler</span>
          </Link>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!isMobile ? (
            <>
              <div className="relative w-64" ref={searchRef}>
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="İçeriklerde ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {isSearchOpen && searchResults && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                    <div className="p-2">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/post/${result.baslik_id}/${result.slug || `icerik-${result.id}`}`}
                          onClick={handleSearchResultClick}
                        >
                          <div className="block rounded-sm px-2 py-1 hover:bg-accent cursor-pointer">
                            {result.title || `İçerik #${result.id}`}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <ThemeToggle />
            </>
          ) : (
            <>
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}