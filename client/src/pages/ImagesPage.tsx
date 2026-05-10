import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as ImageIcon,
  Download,
  Expand,
  X,
  Sparkles,
  Grid3x3,
  RectangleHorizontal,
  RectangleVertical,
  Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { useImages, useGenerateImage, useAttachImageToPost } from '@/hooks/useImages';
import { usePosts } from '@/hooks/usePosts';
import type { GeneratedImage } from '@/services/api';
import { format } from 'date-fns';

const styleOptions = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'flat-design', label: 'Flat Design' },
  { value: '3d-render', label: '3D Render' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'minimalist', label: 'Minimalist' },
];

const sizeOptions = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '1080x1920', label: 'Story (1080x1920)' },
];

const sizeIcons: Record<string, React.ElementType> = {
  '1:1': Grid3x3,
  '16:9': RectangleHorizontal,
  '9:16': RectangleVertical,
  '1080x1920': Smartphone,
};

function ImageCard({
  image,
  postOptions,
  onExpand,
  onAttach,
}: {
  image: GeneratedImage;
  postOptions: Array<{ value: string; label: string }>;
  onExpand: () => void;
  onAttach: (postId: string | null) => void;
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
      <div className="aspect-square cursor-pointer" onClick={onExpand}>
        {image.imageUrl ? (
          <img
            src={image.imageUrl}
            alt={image.prompt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon size={32} />
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end p-2 pointer-events-none">
        <button
          onClick={onExpand}
          className="p-1.5 rounded-lg bg-black/30 text-white hover:bg-black/50 pointer-events-auto"
        >
          <Expand size={14} />
        </button>
      </div>

      {/* Footer with prompt + attach */}
      <div className="p-3 space-y-2 bg-white dark:bg-gray-900">
        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{image.prompt}</p>
        <Select
          value={image.postId ?? ''}
          onChange={(e) => onAttach(e.target.value || null)}
          options={[{ value: '', label: '— Not attached —' }, ...postOptions]}
        />
      </div>
    </div>
  );
}

export function ImagesPage() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [size, setSize] = useState('1:1');
  const [expandedImage, setExpandedImage] = useState<GeneratedImage | null>(null);

  const imagesQuery = useImages();
  const generateMutation = useGenerateImage();
  const attachMutation = useAttachImageToPost();
  const postsQuery = usePosts({ pageSize: 50 });

  const images = imagesQuery.data || [];
  const postsList = postsQuery.data?.data ?? [];
  const postOptions = postsList.map((p) => ({
    value: p.id,
    label: `${p.status === 'scheduled' ? '🕒' : p.status === 'published' ? '✅' : '📝'} ${p.content.slice(0, 50)}…`,
  }));

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(t('images.promptRequired', 'Please describe the image'));
      return;
    }
    await generateMutation.mutateAsync({ prompt, style, size });
    setPrompt('');
  };

  const handleDownload = async (image: GeneratedImage) => {
    if (!image.imageUrl) return;
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `postcommander-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('images.downloadFailed', 'Download failed'));
    }
  };

  const SizeIcon = sizeIcons[size] || Grid3x3;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <ImageIcon size={22} />
          </div>
          {t('images.title', 'AI Image Generator')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('images.subtitle', 'Generate stunning images for your social media posts')}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('images.promptLabel', 'Image description')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t(
              'images.promptPlaceholder',
              'Describe the image you want to generate in detail...',
            )}
            rows={3}
            disabled={generateMutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('images.style', 'Style')}
              options={styleOptions}
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            />
            <Select
              label={t('images.size', 'Size')}
              options={sizeOptions}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>

          {/* Size preview indicator */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <SizeIcon size={20} className="text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {sizeOptions.find((s) => s.value === size)?.label || size}
              </p>
              <p className="text-xs text-gray-400">
                {t('images.sizeHint', 'Optimized for social media')}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              loading={generateMutation.isPending}
              icon={<Sparkles size={18} />}
              size="lg"
              disabled={!prompt.trim()}
            >
              {generateMutation.isPending
                ? t('images.generating', 'Generating...')
                : t('images.generate', 'Generate Image')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {generateMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('images.creating', 'Creating your image...')}
          </p>
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('images.gallery', 'Generated Images')}
            </h3>
            <Badge variant="default">
              {images.length} {t('images.imagesCount', 'images')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                postOptions={postOptions}
                onExpand={() => setExpandedImage(image)}
                onAttach={(postId) => attachMutation.mutate({ imageId: image.id, postId })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!imagesQuery.isLoading && images.length === 0 && !generateMutation.isPending && (
        <Card>
          <div className="text-center py-16">
            <ImageIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('images.noImages', 'No images yet')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('images.noImagesDesc', 'Describe an image above and generate your first one')}
            </p>
          </div>
        </Card>
      )}

      {/* Expanded Image Lightbox */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpandedImage(null)}
          />
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Close button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              {expandedImage.imageUrl && (
                <img
                  src={expandedImage.imageUrl}
                  alt={expandedImage.prompt}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}

              {/* Info bar */}
              <div className="p-4 border-t border-gray-800 space-y-3">
                <p className="text-sm text-gray-300">{expandedImage.prompt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/10 text-white border-0">
                      {expandedImage.provider}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {format(new Date(expandedImage.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={() => handleDownload(expandedImage)}
                  >
                    {t('images.download', 'Download')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
