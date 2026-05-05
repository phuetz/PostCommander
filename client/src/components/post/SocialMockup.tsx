import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Repeat2, 
  MoreHorizontal,
  Globe,
  Verified,
} from 'lucide-react';
import { type PlatformId } from '@postcommander/shared';

interface SocialMockupProps {
  platform: PlatformId;
  content: string;
  userName?: string;
  userHandle?: string;
  userAvatar?: string | null;
  date?: string;
}

export function SocialMockup({
  platform,
  content,
  userName = 'John Doe',
  userHandle = 'johndoe',
  userAvatar,
  date,
}: SocialMockupProps) {
  const { t } = useTranslation();
  const displayDate = date || t('post.social.justNow');
  
  const Avatar = () => (
    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
      {userAvatar ? (
        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
          {userName.slice(0, 2)}
        </div>
      )}
    </div>
  );

  if (platform === 'linkedin') {
    return (
      <div className="bg-white dark:bg-[#1d2226] border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm max-w-full">
        <div className="p-3 pb-0 flex items-start gap-2">
          <Avatar />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white truncate hover:underline cursor-pointer">
                {userName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {t('post.social.first')}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {t('post.social.mockBio')}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{displayDate}</span>
              <span>•</span>
              <Globe size={10} />
            </div>
          </div>
          <button className="text-gray-500">
            <MoreHorizontal size={18} />
          </button>
        </div>
        
        <div className="p-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-normal break-words">
          {content}
        </div>

        <div className="px-3 py-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded transition-colors">
              <Heart size={18} />
              <span className="text-[10px] font-semibold">{t('post.social.like')}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded transition-colors">
              <MessageCircle size={18} />
              <span className="text-[10px] font-semibold">{t('post.social.comment')}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded transition-colors">
              <Share2 size={18} />
              <span className="text-[10px] font-semibold">{t('post.social.repost')}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded transition-colors">
              <Repeat2 size={18} />
              <span className="text-[10px] font-semibold">{t('post.social.send')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'twitter') {
    return (
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm max-w-full">
        <div className="flex gap-3">
          <Avatar />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                  {userName}
                </span>
                <Verified size={14} className="text-[#1d9bf0] flex-shrink-0" />
                <span className="text-[15px] text-gray-500 dark:text-gray-500 truncate">
                  @{userHandle}
                </span>
                <span className="text-[15px] text-gray-500 dark:text-gray-500">•</span>
                <span className="text-[15px] text-gray-500 dark:text-gray-500">{displayDate}</span>
              </div>
              <MoreHorizontal size={16} className="text-gray-500" />
            </div>
            
            <div className="mt-1 text-[15px] text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed break-words">
              {content}
            </div>

            <div className="mt-3 flex items-center justify-between max-w-md text-gray-500 dark:text-gray-500">
              <button className="flex items-center gap-2 hover:text-[#1d9bf0] transition-colors group">
                <div className="p-2 group-hover:bg-[#1d9bf0]/10 rounded-full">
                  <MessageCircle size={16} />
                </div>
                <span className="text-xs">42</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#00ba7c] transition-colors group">
                <div className="p-2 group-hover:bg-[#00ba7c]/10 rounded-full">
                  <Repeat2 size={16} />
                </div>
                <span className="text-xs">12</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#f91880] transition-colors group">
                <div className="p-2 group-hover:bg-[#f91880]/10 rounded-full">
                  <Heart size={16} />
                </div>
                <span className="text-xs">156</span>
              </button>
              <button className="flex items-center gap-2 hover:text-[#1d9bf0] transition-colors group">
                <div className="p-2 group-hover:bg-[#1d9bf0]/10 rounded-full">
                  <Share2 size={16} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generic Mockup for other platforms
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar />
        <div>
          <div className="font-bold text-sm text-gray-900 dark:text-white">{userName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{displayDate} • {platform}</div>
        </div>
      </div>
      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}
