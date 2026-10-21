import { CString, dlopen, FFIType } from 'bun:ffi';
import type { DesktopTheme } from './types/desktop.types';
import type { Pointer } from 'bun:ffi';

const objcPath = '/usr/lib/libobjc.A.dylib';

const objc = dlopen(objcPath, {
  objc_getClass: { args: [FFIType.ptr], returns: FFIType.ptr },
  sel_registerName: { args: [FFIType.ptr], returns: FFIType.ptr },
  objc_msgSend: { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
});

const objcWithArg = dlopen(objcPath, {
  objc_msgSend: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr], returns: FFIType.ptr },
});

const objcOnMain = dlopen(objcPath, {
  objc_msgSend: { args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.bool], returns: FFIType.ptr },
});

const desktopAppearances = { light: 'NSAppearanceNameAqua', dark: 'NSAppearanceNameDarkAqua' } satisfies Record<DesktopTheme, string>;

// Mirrors System Settings > Desktop & Dock > "Double-click a window's title bar to".
const desktopTitleBarActions: Record<string, string | null> = { Minimize: 'miniaturize:', None: null };

function desktopCString(text: string): Buffer {
  return Buffer.from(`${text}\0`);
}

function desktopSelector(name: string) {
  return objc.symbols.sel_registerName(desktopCString(name));
}

function desktopString(text: string) {
  return objcWithArg.symbols.objc_msgSend(objc.symbols.objc_getClass(desktopCString('NSString')), desktopSelector('stringWithUTF8String:'), desktopCString(text));
}

function desktopWindowSet(window: Pointer, setter: string, value: ReturnType<typeof desktopString>): void {
  objcOnMain.symbols.objc_msgSend(window, desktopSelector('performSelectorOnMainThread:withObject:waitUntilDone:'), desktopSelector(setter), value, true);
}

export function desktopWindowToolbar(window: Pointer): void {
  const toolbar = objcWithArg.symbols.objc_msgSend(objc.symbols.objc_msgSend(objc.symbols.objc_getClass(desktopCString('NSToolbar')), desktopSelector('alloc')), desktopSelector('initWithIdentifier:'), desktopString('openbots'));

  desktopWindowSet(window, 'setToolbar:', toolbar);
}

export function desktopWindowAppearance(window: Pointer, theme: DesktopTheme): void {
  const appearance = objcWithArg.symbols.objc_msgSend(objc.symbols.objc_getClass(desktopCString('NSAppearance')), desktopSelector('appearanceNamed:'), desktopString(desktopAppearances[theme]));

  desktopWindowSet(window, 'setAppearance:', appearance);
}

export function desktopWindowTitleBarDoubleClick(window: Pointer): void {
  const defaults = objc.symbols.objc_msgSend(objc.symbols.objc_getClass(desktopCString('NSUserDefaults')), desktopSelector('standardUserDefaults'));
  const preference = objcWithArg.symbols.objc_msgSend(defaults, desktopSelector('stringForKey:'), desktopString('AppleActionOnDoubleClick'));
  const action = preference ? new CString(objc.symbols.objc_msgSend(preference, desktopSelector('UTF8String'))).toString() : '';
  const selector = Object.hasOwn(desktopTitleBarActions, action) ? desktopTitleBarActions[action] : 'zoom:';

  if (selector) {
    desktopWindowSet(window, selector, null);
  }
}
