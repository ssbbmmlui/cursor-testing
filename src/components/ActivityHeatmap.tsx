import { useLanguage } from '../i18n/LanguageContext';
import { buildHeatmap, heatClass, type HeatCell } from '../scores/dates';

export function ActivityHeatmap({ timestamps }: { timestamps: string[] }) {
  const { lang } = useLanguage();
  const { weeks } = buildHeatmap(timestamps);
  const locale = lang === 'zh' ? 'zh-Hant' : 'en';
  const weekdayLabels = lang === 'zh' ? ['一', '', '三', '', '五', '', ''] : ['M', '', 'W', '', 'F', '', ''];
  const monthLabels = weeks.map((week, index) => monthLabel(week, weeks[index - 1], locale));

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="flex w-max gap-[3px]">
        <div className="mt-4 flex flex-col gap-[3px] pr-1 text-[10px] leading-3 text-slate-400">
          {weekdayLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="flex h-3 w-4 items-center">
              {label}
            </span>
          ))}
        </div>
        <div>
          <div className="flex h-4 gap-[3px]">
            {weeks.map((week, index) => (
              <div key={week[0]?.key ?? index} className="w-3 overflow-visible whitespace-nowrap text-[10px] leading-4 text-slate-400">
                {monthLabels[index]}
              </div>
            ))}
          </div>
          <div className="flex gap-[3px]" role="img" aria-label={locale === 'zh-Hant' ? '活動熱力圖' : 'Activity heatmap'}>
            {weeks.map((week) => (
              <div key={week[0].key} className="flex flex-col gap-[3px]">
                {week.map((cell) => (
                  <span
                    key={cell.key}
                    title={cell.inRange ? `${cell.key}: ${cell.count}` : undefined}
                    className={`h-3 w-3 rounded-[2px] ${cell.inRange ? heatClass(cell.count) : 'bg-transparent'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
        <span>0</span>
        <span className="h-3 w-3 rounded-[2px] bg-slate-200" />
        <span className="h-3 w-3 rounded-[2px] bg-green-200" />
        <span className="h-3 w-3 rounded-[2px] bg-green-400" />
        <span className="h-3 w-3 rounded-[2px] bg-green-600" />
        <span className="h-3 w-3 rounded-[2px] bg-green-800" />
        <span>7+</span>
      </div>
    </div>
  );
}

function monthLabel(week: HeatCell[], previous: HeatCell[] | undefined, locale: string): string {
  const first = week.find((cell) => cell.inRange);
  if (!first) return '';
  const previousCell = previous?.find((cell) => cell.inRange);
  if (previousCell && previousCell.date.getMonth() === first.date.getMonth() && previousCell.date.getFullYear() === first.date.getFullYear()) {
    return '';
  }
  return first.date.toLocaleDateString(locale, { month: 'short' });
}
