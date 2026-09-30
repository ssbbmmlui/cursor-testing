import {
  Activity,
  Atom,
  BookOpen,
  Briefcase,
  Calculator,
  Clock,
  Cpu,
  Dna,
  Globe,
  Languages,
  Microscope,
  Music,
  TestTube,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Lang } from '../types';

export type Subject = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: LucideIcon;
  iconClass: string;
  lineClass: string;
};

export const SUBJECTS: Subject[] = [
  {
    id: 'chinese',
    name: 'Chinese',
    nameZh: '中文',
    description: 'Learn Chinese language and culture through interactive games',
    descriptionZh: '通過互動遊戲學習中文語言和文化',
    icon: Languages,
    iconClass: 'bg-gradient-to-br from-red-500 to-pink-500',
    lineClass: 'from-red-500 to-pink-500',
  },
  {
    id: 'english',
    name: 'English',
    nameZh: '英文',
    description: 'Master English language skills with fun educational games',
    descriptionZh: '通過趣味教育遊戲掌握英語技能',
    icon: BookOpen,
    iconClass: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    lineClass: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    nameZh: '數學',
    description: 'Practice math concepts through engaging problem-solving games',
    descriptionZh: '通過解題遊戲實踐數學概念',
    icon: Calculator,
    iconClass: 'bg-gradient-to-br from-emerald-500 to-cyan-500',
    lineClass: 'from-emerald-500 to-cyan-500',
  },
  {
    id: 'physics',
    name: 'Physics',
    nameZh: '物理',
    description: 'Explore physics principles with interactive simulations',
    descriptionZh: '通過互動模擬探索物理原理',
    icon: Atom,
    iconClass: 'bg-gradient-to-br from-purple-500 to-fuchsia-500',
    lineClass: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    nameZh: '化學',
    description: 'Discover chemistry through virtual experiments and games',
    descriptionZh: '通過虛擬實驗和遊戲發現化學之美',
    icon: TestTube,
    iconClass: 'bg-gradient-to-br from-orange-500 to-yellow-400',
    lineClass: 'from-orange-500 to-yellow-400',
  },
  {
    id: 'biology',
    name: 'Biology',
    nameZh: '生物',
    description: 'Learn about life sciences through interactive experiences',
    descriptionZh: '通過互動體驗學習生命科學',
    icon: Dna,
    iconClass: 'bg-gradient-to-br from-green-500 to-teal-400',
    lineClass: 'from-green-500 to-teal-400',
  },
  {
    id: 'science',
    name: 'Science',
    nameZh: '科學',
    description: 'Explore science ideas through hands-on experiments and design challenges',
    descriptionZh: '透過動手實驗和設計挑戰探索科學概念',
    icon: Microscope,
    iconClass: 'bg-gradient-to-br from-indigo-500 to-cyan-500',
    lineClass: 'from-indigo-500 to-cyan-500',
  },
  {
    id: 'geography',
    name: 'Geography',
    nameZh: '地理',
    description: 'Explore world geography with maps and location games',
    descriptionZh: '通過地圖和地點遊戲探索世界地理',
    icon: Globe,
    iconClass: 'bg-gradient-to-br from-teal-500 to-blue-500',
    lineClass: 'from-teal-500 to-blue-500',
  },
  {
    id: 'history',
    name: 'History',
    nameZh: '歷史',
    description: 'Journey through history with timeline and event games',
    descriptionZh: '通過時間線和事件遊戲穿越歷史',
    icon: Clock,
    iconClass: 'bg-gradient-to-br from-amber-500 to-orange-500',
    lineClass: 'from-amber-500 to-orange-500',
  },
  {
    id: 'chinese-history',
    name: 'Chinese History',
    nameZh: '中國歷史',
    description: 'Discover Chinese historical events and cultural heritage',
    descriptionZh: '發現中國歷史事件和文化遺產',
    icon: Clock,
    iconClass: 'bg-gradient-to-br from-rose-500 to-red-600',
    lineClass: 'from-rose-500 to-red-600',
  },
  {
    id: 'economics',
    name: 'Economics',
    nameZh: '經濟',
    description: 'Learn economic principles through simulation games',
    descriptionZh: '通過模擬遊戲學習經濟原理',
    icon: TrendingUp,
    iconClass: 'bg-gradient-to-br from-sky-500 to-indigo-600',
    lineClass: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'bafs',
    name: 'BAFs',
    nameZh: '企會財',
    description: 'Business, Accounting and Financial Studies games',
    descriptionZh: '企業、會計與財務概論遊戲',
    icon: Briefcase,
    iconClass: 'bg-gradient-to-br from-slate-500 to-slate-700',
    lineClass: 'from-slate-500 to-slate-700',
  },
  {
    id: 'music',
    name: 'Music',
    nameZh: '音樂',
    description: 'Learn music and subject knowledge through rhythm games and educational songs',
    descriptionZh: '透過節奏遊戲和教育歌曲學習音樂及學科知識',
    icon: Music,
    iconClass: 'bg-gradient-to-br from-rose-500 to-orange-400',
    lineClass: 'from-rose-500 to-orange-400',
  },
  {
    id: 'physical-education',
    name: 'Physical Education',
    nameZh: '體育',
    description: 'Learn about health and fitness through active games',
    descriptionZh: '通過活動遊戲學習健康和體適能',
    icon: Activity,
    iconClass: 'bg-gradient-to-br from-cyan-500 to-sky-500',
    lineClass: 'from-cyan-500 to-sky-500',
  },
  {
    id: 'tools',
    name: 'Tools',
    nameZh: '工具',
    description: 'Interactive tools that can be used in classrooms',
    descriptionZh: '可在課堂中使用的互動工具',
    icon: Wrench,
    iconClass: 'bg-gradient-to-br from-gray-500 to-gray-700',
    lineClass: 'from-gray-500 to-gray-700',
  },
  {
    id: 'aiot',
    name: 'AIoT',
    nameZh: 'AIoT',
    description: 'Explore artificial intelligence and Internet of Things concepts',
    descriptionZh: '探索人工智能和物聯網概念',
    icon: Cpu,
    iconClass: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
    lineClass: 'from-fuchsia-500 to-purple-600',
  },
  {
    id: 'others',
    name: 'Others',
    nameZh: '其他',
    description: 'Explore games created by students',
    descriptionZh: '探索由學生創作的遊戲',
    icon: Users,
    iconClass: 'bg-gradient-to-br from-lime-500 to-emerald-600',
    lineClass: 'from-lime-500 to-emerald-600',
  },
];

const subjectById = new Map(SUBJECTS.map((subject) => [subject.id, subject]));

export function getSubject(id: string): Subject | undefined {
  return subjectById.get(id);
}

export function subjectName(subject: Subject, lang: Lang): string {
  return lang === 'zh' ? subject.nameZh : subject.name;
}

export function subjectDescription(subject: Subject, lang: Lang): string {
  return lang === 'zh' ? subject.descriptionZh : subject.description;
}
