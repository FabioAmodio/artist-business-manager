export interface SwipeAction {
  readonly key: string;
  readonly icon: string;
  readonly label: string;
  /** 'auto' actions can be triggered by an over-drag past double width or by a fast fling. */
  readonly kind?: 'default' | 'auto';
  readonly variant?: 'default' | 'danger' | 'neutral' | 'neutral-warning' | 'neutral-success';
  readonly disabled?: boolean;
  readonly run: () => void;
}
