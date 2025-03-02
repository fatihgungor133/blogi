import { useState } from "react";
import { Link } from "wouter";
import { Input } from "./ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import type { Content } from "@shared/schema";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Search } from "lucide-react";

export function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: searchResults } = useQuery<Content[]>({
    queryKey: ['/api/search', debouncedSearch],
    queryFn: () => 
      fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`).then(res => res.json()),
    enabled: debouncedSearch.length > 2
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/">
          <div className="mr-8 flex items-center space-x-2 cursor-pointer">
            <span className="hidden font-bold sm:inline-block">Blog</span>
          </div>
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Kategoriler</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-6 w-[400px]">
                  <Link href="/category/teknoloji">
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      Teknoloji
                    </NavigationMenuLink>
                  </Link>
                  <Link href="/category/yazilim">
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      Yazılım
                    </NavigationMenuLink>
                  </Link>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İçeriklerde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchResults && searchResults.length > 0 && searchTerm && (
              <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                <div className="p-2">
                  {searchResults.map((result) => (
                    <Link 
                      key={result.id} 
                      href={`/post/${result.baslik_id}/${result.slug || `icerik-${result.id}`}`}
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
        </div>
      </div>
    </header>
  );
}