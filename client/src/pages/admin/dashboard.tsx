import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout", {});
      setLocation("/admin/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin/dashboard">
                  <span className="text-xl font-bold cursor-pointer">Admin Panel</span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin/settings">
                  <Button variant="ghost" className="inline-flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Site Ayarları
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Hoş Geldiniz</h2>
            <p className="text-muted-foreground">
              Sol menüden site ayarlarını düzenleyebilirsiniz.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}