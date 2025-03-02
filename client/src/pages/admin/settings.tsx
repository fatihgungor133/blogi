import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SiteSettings, FooterSettings } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ['/api/admin/settings/site'],
  });

  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ['/api/admin/settings/footer'],
  });

  const { register: siteRegister, handleSubmit: handleSiteSubmit } = useForm({
    defaultValues: siteSettings,
  });

  const { register: footerRegister, handleSubmit: handleFooterSubmit } = useForm({
    defaultValues: footerSettings,
  });

  const onSiteSubmit = async (data: any) => {
    try {
      await apiRequest("PATCH", "/api/admin/settings/site", data);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/site', '/api/site/settings'] });
      toast({ description: "Site ayarları güncellendi" });
    } catch (error) {
      toast({ variant: "destructive", description: "Bir hata oluştu" });
    }
  };

  const onFooterSubmit = async (data: any) => {
    try {
      await apiRequest("PATCH", "/api/admin/settings/footer", data);
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/footer', '/api/site/footer'] });
      toast({ description: "Footer ayarları güncellendi" });
    } catch (error) {
      toast({ variant: "destructive", description: "Bir hata oluştu" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSiteSubmit(onSiteSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                {...siteRegister("siteName")}
                placeholder="Site Adı"
              />
            </div>
            <div className="space-y-2">
              <Textarea
                {...siteRegister("metaDescription")}
                placeholder="Meta Açıklama"
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer Ayarları</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFooterSubmit(onFooterSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                {...footerRegister("aboutText")}
                placeholder="Hakkımızda Metni"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Input
                {...footerRegister("email")}
                placeholder="E-posta Adresi"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Input
                {...footerRegister("phone")}
                placeholder="Telefon Numarası"
              />
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}