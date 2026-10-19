export interface SidebarSwipeRelease {
  offset: number
  velocity: number
}

export interface SidebarSwipeOptions {
  side: 'left' | 'right'
  enabled: boolean
  onDrag: (offset: number) => void
  onRelease: (release: SidebarSwipeRelease) => void
}
