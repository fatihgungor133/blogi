import { Twitter, Facebook, Linkedin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast({
          description: "İçerik başarıyla paylaşıldı",
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast({
            variant: "destructive",
            description: "Paylaşım sırasında bir hata oluştu",
          });
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          description: "Bağlantı panoya kopyalandı",
        });
      } catch (err) {
        toast({
          variant: "destructive",
          description: "Bağlantı kopyalanamadı",
        });
      }
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  return (
    <div className="flex items-center gap-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(shareUrls.twitter, '_blank')}
        className="hover:text-[#1DA1F2] transition-colors"
      >
        <Twitter className="h-4 w-4" />
        <span className="sr-only">Twitter'da Paylaş</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(shareUrls.facebook, '_blank')}
        className="hover:text-[#4267B2] transition-colors"
      >
        <Facebook className="h-4 w-4" />
        <span className="sr-only">Facebook'ta Paylaş</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => window.open(shareUrls.linkedin, '_blank')}
        className="hover:text-[#0077B5] transition-colors"
      >
        <Linkedin className="h-4 w-4" />
        <span className="sr-only">LinkedIn'de Paylaş</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleShare}
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Paylaş</span>
      </Button>
    </div>
  );
}
