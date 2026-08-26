declare module 'frappe-gantt' {
  export interface FrappeGanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    [key: string]: unknown;
  }

  export interface FrappeGanttOptions {
    view_mode?: string;
    bar_height?: number;
    bar_corner_radius?: number;
    padding?: number;
    popup_on?: 'click' | 'hover';
    readonly_progress?: boolean;
    readonly_dates?: boolean;
    readonly?: boolean;
    today_button?: boolean;
    lines?: 'both' | 'vertical' | 'horizontal' | 'none';
    popup?: (ctx: PopupCtx) => void | string | false;
    on_click?: (task: FrappeGanttTask) => void;
    on_date_change?: (task: FrappeGanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: FrappeGanttTask, progress: number) => void;
    on_view_change?: (mode: string) => void;
    [key: string]: unknown;
  }

  export interface PopupCtx {
    task: FrappeGanttTask;
    chart: Gantt;
    set_title: (title: string) => void;
    set_subtitle: (subtitle: string) => void;
    set_details: (details: string) => void;
    get_title: () => HTMLElement;
    get_subtitle: () => HTMLElement;
    get_details: () => HTMLElement;
    add_action: (
      html: string | ((task: FrappeGanttTask) => string),
      fn: (task: FrappeGanttTask, chart: Gantt, e: MouseEvent) => void,
    ) => void;
  }

  export default class Gantt {
    constructor(
      element: HTMLElement | string,
      tasks: FrappeGanttTask[],
      options?: FrappeGanttOptions,
    );
    refresh(tasks: FrappeGanttTask[]): void;
    change_view_mode(mode: string): void;
    get_bar(id: string): unknown;
  }
}
