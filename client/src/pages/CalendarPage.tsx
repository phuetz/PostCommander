import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Repeat,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import clsx from 'clsx';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useDroppable,
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';

import { getPosts } from '@/services/api';
import { useUpdatePost } from '@/hooks/usePosts';
import type { Post } from '@postcommander/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-400',
  published: 'bg-green-500',
  scheduled: 'bg-blue-500',
  failed: 'bg-red-500',
};

const statusBadge: Record<string, 'default' | 'success' | 'info' | 'danger'> = {
  draft: 'default',
  published: 'success',
  scheduled: 'info',
  failed: 'danger',
};

// ── Draggable Post Item ──────────────────────────────────────────────

function DraggablePost({ post }: { post: Post }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id, data: { post } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`calendar-post-${post.id}`}
      className="flex items-center justify-between p-1 rounded bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing mb-1"
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            statusColors[post.status] || 'bg-gray-400',
          )}
        />
        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
          {post.originalPrompt?.slice(0, 20) || post.content.slice(0, 20)}
        </span>
      </div>
      {post.originalPostId && (
        <span title="Recycled Evergreen Post" className="ml-1 flex-shrink-0 flex items-center">
          <Repeat size={10} className="text-green-500" />
        </span>
      )}
    </div>
  );
}

// ── Droppable Day Cell ───────────────────────────────────────────────

function CalendarDay({ 
  dateKey,
  day, 
  posts, 
  currentDate, 
  isSelected, 
  onClick 
}: { 
  dateKey: string;
  day: Date; 
  posts: Post[]; 
  currentDate: Date;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const inMonth = isSameMonth(day, currentDate);
  const today = isToday(day);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      data-testid={`calendar-day-${dateKey}`}
      className={clsx(
        'relative min-h-[100px] p-1.5 sm:p-2 border-b border-r border-gray-200 dark:border-gray-800 text-left transition-colors',
        inMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950',
        isOver && 'bg-brand-50 dark:bg-brand-900/20',
        isSelected && 'ring-2 ring-inset ring-brand-500 z-10',
        !isSelected && 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={clsx(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
            today
              ? 'bg-brand-600 text-white'
              : inMonth
                ? 'text-gray-700 dark:text-gray-300'
                : 'text-gray-400 dark:text-gray-600',
          )}
        >
          {format(day, 'd')}
        </span>
      </div>

      <div className="space-y-1">
        {posts.map((post) => (
          <DraggablePost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const currentLocale = i18n.language === 'fr' ? fr : enUS;

  const postsQuery = useQuery({
    queryKey: ['posts', { page: 1, pageSize: 200 }],
    queryFn: () => getPosts({ page: 1, pageSize: 200 }),
  });

  const updatePostMutation = useUpdatePost();

  const posts = postsQuery.data?.data;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const postsByDate = useMemo(() => {
    const sourcePosts = posts ?? [];
    const map = new Map<string, Post[]>();
    for (const post of sourcePosts) {
      const date = post.scheduledAt || post.publishedAt || post.createdAt;
      const dateKey = format(parseISO(date), 'yyyy-MM-dd');
      const arr = map.get(dateKey) || [];
      arr.push(post);
      map.set(dateKey, arr);
    }
    return map;
  }, [posts]);

  const selectedDayPosts = selectedDay
    ? postsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const draggedPost = active.data.current?.post as Post;
      const targetDateStr = over.id as string; // We'll make days droppable with their date strings
      
      // Simple date format check
      if (/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
        const newDate = new Date(targetDateStr);
        // Preserve original time if scheduled
        if (draggedPost.scheduledAt) {
          const originalTime = new Date(draggedPost.scheduledAt);
          newDate.setHours(originalTime.getHours(), originalTime.getMinutes());
        } else {
          newDate.setHours(10, 0); // Default to 10 AM
        }

        try {
          await updatePostMutation.mutateAsync({
            id: draggedPost.id,
            updates: {
              scheduledAt: newDate.toISOString(),
              status: 'scheduled',
            },
          });
          toast.success(t('calendar.moved', { date: format(newDate, 'MMM d', { locale: currentLocale }) }));
        } catch {
          // Toast handled by hook
        }
      }
    }
  };

  const weekDays = [
    t('calendar.weekDays.mon'),
    t('calendar.weekDays.tue'),
    t('calendar.weekDays.wed'),
    t('calendar.weekDays.thu'),
    t('calendar.weekDays.fri'),
    t('calendar.weekDays.sat'),
    t('calendar.weekDays.sun'),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <Card>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600">
              <CalendarIcon size={22} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {format(currentDate, 'MMMM yyyy', { locale: currentLocale })}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronLeft size={18} />}
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              {t('calendar.today')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<ChevronRight size={18} />}
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            />
          </div>
        </div>

        {postsQuery.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-800">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayPosts = postsByDate.get(dateKey) || [];
                
                return (
                  <CalendarDay
                    key={dateKey}
                    dateKey={dateKey}
                    day={day}
                    posts={dayPosts}
                    currentDate={currentDate}
                    isSelected={selectedDay ? isSameDay(day, selectedDay) : false}
                    onClick={() => setSelectedDay(day)}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="p-2 rounded bg-white dark:bg-gray-800 border border-brand-500 shadow-xl scale-105 rotate-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {t('calendar.moving')}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Card>

      {/* Day detail modal */}
      <Modal
        open={selectedDay !== null && selectedDayPosts.length > 0}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? format(selectedDay, 'EEEE, MMMM d, yyyy', { locale: currentLocale }) : ''}
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selectedDayPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {post.originalPrompt || post.content.slice(0, 100)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusBadge[post.status] || 'default'}>
                      {t(`history.${post.status}`, post.status)}
                    </Badge>
                    {post.scheduledAt && (
                      <span className="text-[10px] text-gray-500">
                        {format(parseISO(post.scheduledAt), 'HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => (window.location.href = `/app/generate?id=${post.id}`)}>
                  {t('common.edit')}
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                {post.content}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
