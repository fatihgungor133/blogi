import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Settings, LogOut, Key, Map } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout", {});
      setLocation("/admin/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiRequest("POST", "/api/admin/change-password", {
        currentPassword,
        newPassword
      });
      
      toast({
        title: "Başarılı",
        description: "Şifreniz başarıyla değiştirildi."
      });
      
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şifre değiştirilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      await apiRequest("POST", "/api/admin/generate-sitemap", {});
      toast({
        title: "Başarılı",
        description: "Sitemap başarıyla oluşturuldu."
      });
    } catch (error) {
      console.error("Sitemap oluşturulurken hata oluştu:", error);
      toast({
        title: "Hata",
        description: "Sitemap oluşturulurken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Admin Paneli</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Ayarları</CardTitle>
            <CardDescription>Site görünümünü ve ayarlarını düzenleyin</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/admin/settings">
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" /> Ayarları Düzenle
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Şifre Değiştir</CardTitle>
            <CardDescription>Admin hesabınızın şifresini güncelleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isChangingPassword}>
                <Key className="mr-2 h-4 w-4" /> {isChangingPassword ? "İşleniyor..." : "Şifreyi Değiştir"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sitemap Oluştur</CardTitle>
            <CardDescription>Site için XML sitemap dosyalarını oluşturun</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bu işlem, arama motorları için tüm içeriklerinizi içeren sitemap dosyalarını oluşturacaktır. 
              Her sitemap dosyası en fazla 20.000 URL içerecek şekilde bölünecektir.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateSitemap} 
              className="w-full" 
              disabled={isGeneratingSitemap}
            >
              <Map className="mr-2 h-4 w-4" /> 
              {isGeneratingSitemap ? "Oluşturuluyor..." : "Sitemap Oluştur"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Çıkış Yap</CardTitle>
            <CardDescription>Admin oturumunuzu sonlandırın</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleLogout} variant="destructive" className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Çıkış Yap
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}