import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Hash,
  Linkedin,
  Twitter,
  Instagram,
  Download,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import toast from 'react-hot-toast';
import type { LLMProviderId, ToneId } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ToneSelector } from '@/components/post/ToneSelector';
import { LLMSelector } from '@/components/post/LLMSelector';
import { generateCarousel, type CarouselResult, type CarouselSlide } from '@/services/api';

const platformOptions = [
  { value: 'linkedin-carousel', label: 'LinkedIn Carousel' },
  { value: 'twitter-thread', label: 'X Thread' },
  { value: 'instagram-carousel', label: 'Instagram Carousel' },
];

const slideCountOptions = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 3),
  label: `${i + 3} slides`,
}));

const platformIcons: Record<string, React.ElementType> = {
  'linkedin-carousel': Linkedin,
  'twitter-thread': Twitter,
  'instagram-carousel': Instagram,
};

const platformGradients: Record<string, string> = {
  'linkedin-carousel': 'from-blue-600 to-blue-800',
  'twitter-thread': 'from-gray-800 to-black',
  'instagram-carousel': 'from-purple-500 via-pink-500 to-orange-400',
};

function SlideCard({
  slide,
  platform,
  totalSlides,
}: {
  slide: CarouselSlide;
  platform: string;
  totalSlides: number;
}) {
  const [copied, setCopied] = useState(false);
  const isThread = platform === 'twitter-thread';
  const gradient = platformGradients[platform] || 'from-brand-600 to-brand-800';

  const handleCopy = async () => {
    const text = isThread
      ? slide.body
      : `${slide.title}\n\n${slide.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isThread) {
    return (
      <div className="min-w-[320px] max-w-[320px] snap-center">
        <Card hover className="h-full">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="default">
                {slide.slideNumber}/{totalSlides}
              </Badge>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {slide.body}
            </p>
            <div className="text-xs text-gray-400 text-right">
              {slide.body.length}/280
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-w-[280px] max-w-[280px] snap-center">
      <div 
        id={`slide-${slide.slideNumber}`}
        className={`bg-gradient-to-br ${gradient} rounded-2xl overflow-hidden shadow-lg aspect-square flex flex-col relative`}
      >
        <div className="absolute top-3 right-3" data-html2canvas-ignore="true">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-white" />
            ) : (
              <Copy size={14} className="text-white" />
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center p-6 text-white">
          <div className="text-xs font-medium uppercase tracking-wider text-white/60 mb-3">
            {slide.slideNumber}/{totalSlides}
          </div>
          <h3 className="text-lg font-bold mb-3 leading-snug">
            {slide.title}
          </h3>
          <p className="text-sm text-white/85 leading-relaxed line-clamp-6">
            {slide.body}
          </p>
        </div>

        <div className="px-6 pb-4">
          <div className="flex gap-1 justify-center">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === slide.slideNumber - 1
                    ? 'w-4 bg-white'
                    : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CarouselPage() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('linkedin-carousel');
  const [tone, setTone] = useState<ToneId>('professional');
  const [slideCount, setSlideCount] = useState('8');
  const [provider, setProvider] = useState<LLMProviderId>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      generateCarousel({
        topic,
        platform,
        tone,
        slideCount: parseInt(slideCount),
        provider,
        model,
      }),
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : t('common.error', 'An error occurred'),
      );
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error(t('carousel.topicRequired', 'Please enter a topic'));
      return;
    }
    mutation.mutate();
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 310;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleCopyAll = async () => {
    if (!result) return;
    const isThread = platform === 'twitter-thread';
    const text = result.slides
      .map((s) =>
        isThread ? `${s.slideNumber}/ ${s.body}` : `[Slide ${s.slideNumber}]\n${s.title}\n\n${s.body}`,
      )
      .join('\n\n---\n\n');
    const fullText = result.caption
      ? `${result.caption}\n\n---\n\n${text}`
      : text;
    await navigator.clipboard.writeText(fullText);
    setAllCopied(true);
    toast.success(t('post.copied', 'Copied!'));
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleDownloadImages = async () => {
    if (!result || platform === 'twitter-thread') return;
    setIsExporting(true);
    
    try {
      const zip = new JSZip();
      
      for (const slide of result.slides) {
        const node = document.getElementById(`slide-${slide.slideNumber}`);
        if (node) {
          // Add a small delay for fonts/styles to render correctly
          await new Promise((resolve) => setTimeout(resolve, 100));
          
          const dataUrl = await toPng(node, {
            quality: 1,
            pixelRatio: 2, // High resolution for social media
            filter: (node) => {
              // We added data-html2canvas-ignore to the copy button, 
              // but html-to-image uses a different filter mechanism sometimes.
              // Just to be safe:
              const el = node as HTMLElement;
              return el.dataset?.html2canvasIgnore !== 'true';
            }
          });
          
          // dataUrl is a base64 string: data:image/png;base64,....
          const base64Data = dataUrl.split(',')[1];
          zip.file(`slide-${slide.slideNumber}.png`, base64Data, { base64: true });
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carousel-${platform}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(t('carousel.downloadSuccess', 'Images downloaded successfully!'));
    } catch (err) {
      console.error('Error generating images:', err);
      toast.error(t('carousel.downloadError', 'Failed to generate images.'));
    } finally {
      setIsExporting(false);
    }
  };

  const PlatformIcon = platformIcons[platform] || Layers;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Layers size={22} />
          </div>
          {t('carousel.title', 'Carousel & Thread Generator')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t(
            'carousel.subtitle',
            'Create engaging carousels for LinkedIn/Instagram or threads for X',
          )}
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <div className="space-y-5">
          <TextArea
            label={t('carousel.topicLabel', 'Topic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t(
              'carousel.topicPlaceholder',
              'e.g., "10 lessons I learned building a SaaS product"',
            )}
            rows={3}
            disabled={mutation.isPending}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('carousel.platform', 'Format')}
              options={platformOptions}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            />
            <Select
              label={t('carousel.slideCount', 'Number of slides')}
              options={slideCountOptions}
              value={slideCount}
              onChange={(e) => setSlideCount(e.target.value)}
            />
          </div>

          <ToneSelector selected={tone} onChange={setTone} />

          <LLMSelector
            provider={provider}
            model={model}
            onProviderChange={setProvider}
            onModelChange={setModel}
          />

          <div className="pt-2">
            <Button
              onClick={handleGenerate}
              loading={mutation.isPending}
              icon={<PlatformIcon size={18} />}
              size="lg"
              disabled={!topic.trim()}
            >
              {mutation.isPending
                ? t('carousel.generating', 'Generating...')
                : t('carousel.generate', 'Generate Carousel')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('carousel.crafting', 'Crafting your carousel...')}
          </p>
        </div>
      )}

      {/* Results */}
      {result && !mutation.isPending && (
        <div className="space-y-5">
          {/* Caption */}
          {result.caption && (
            <Card>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('carousel.caption', 'Caption / Intro')}
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {result.caption}
                </p>
              </div>
            </Card>
          )}

          {/* Slides carousel viewer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {platform === 'twitter-thread'
                  ? t('carousel.thread', 'Thread')
                  : t('carousel.slides', 'Slides')}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={
                    allCopied ? <Check size={14} /> : <Copy size={14} />
                  }
                  onClick={handleCopyAll}
                >
                  {allCopied
                    ? t('post.copied', 'Copied!')
                    : t('carousel.copyAll', 'Copy All')}
                </Button>
                {platform !== 'twitter-thread' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Download size={14} />}
                    onClick={handleDownloadImages}
                    loading={isExporting}
                    disabled={isExporting}
                  >
                    {isExporting ? t('carousel.exporting', 'Exporting...') : t('carousel.download', 'Download Images')}
                  </Button>
                )}
                <button
                  onClick={() => scrollCarousel('left')}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            >
              {result.slides.map((slide) => (
                <SlideCard
                  key={slide.slideNumber}
                  slide={slide}
                  platform={platform}
                  totalSlides={result.slides.length}
                />
              ))}
            </div>
          </div>

          {/* Hashtags */}
          {result.hashtags && result.hashtags.length > 0 && (
            <Card>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Hash size={14} />
                  {t('carousel.hashtags', 'Suggested Hashtags')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
