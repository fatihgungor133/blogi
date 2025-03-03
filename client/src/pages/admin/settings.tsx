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
import { useEffect, useState } from "react";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: siteSettings, isLoading: siteLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/admin/settings/site'],
  });

  const { data: footerSettings, isLoading: footerLoading } = useQuery<FooterSettings>({
    queryKey: ['/api/admin/settings/footer'],
  });

  const { register: siteRegister, handleSubmit: handleSiteSubmit, reset: resetSiteForm } = useForm({
    defaultValues: {
      siteName: '',
      metaDescription: ''
    }
  });

  const { register: footerRegister, handleSubmit: handleFooterSubmit, reset: resetFooterForm } = useForm({
    defaultValues: {
      aboutText: '',
      email: '',
      phone: ''
    }
  });

  // Form değerlerini siteSettings ve footerSettings yüklendiğinde güncelle
  useEffect(() => {
    if (siteSettings) {
      resetSiteForm({
        siteName: siteSettings.siteName,
        metaDescription: siteSettings.metaDescription || ''
      });
    }
  }, [siteSettings, resetSiteForm]);

  useEffect(() => {
    if (footerSettings) {
      resetFooterForm({
        aboutText: footerSettings.aboutText,
        email: footerSettings.email || '',
        phone: footerSettings.phone || ''
      });
    }
  }, [footerSettings, resetFooterForm]);

  const onSiteSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", "/api/admin/settings/site", data);
      await queryClient.invalidateQueries({ 
        queryKey: [['/api/admin/settings/site'], ['/api/site/settings']]
      });
      toast({
        title: "Başarılı",
        description: "Site ayarları güncellendi.",
        status: "success"
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Site ayarları güncellenirken bir hata oluştu.",
        status: "error"
      });
    } finally {
      setIsSubmitting(false);
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

  if (siteLoading || footerLoading) {
    return <div>Yükleniyor...</div>;
  }

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