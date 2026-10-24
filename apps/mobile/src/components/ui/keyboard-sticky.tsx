import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface KeyboardStickyProps {
  children: ReactNode;
}

// Bottom floating bars sit 8pt inside the home-indicator inset; above the keyboard they keep an 8pt gap.
const KEYBOARD_STICKY_GAP = 16;

/** Floating controls that ride on top of the keyboard; the keyboard covers the home-indicator inset. */
export function KeyboardSticky({ children }: KeyboardStickyProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom - KEYBOARD_STICKY_GAP }} pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
      {children}
    </KeyboardStickyView>
  );
}
