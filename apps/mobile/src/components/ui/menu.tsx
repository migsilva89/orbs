import { Button, Divider, Host, RNHostView, Section, ContextMenu as SwiftContextMenu, Menu as SwiftMenu } from '@expo/ui/swift-ui';
import { buttonStyle, disabled, menuIndicator, menuStyle } from '@expo/ui/swift-ui/modifiers';
import { Fragment, useState } from 'react';
import { View } from 'react-native';
import { match, P } from 'ts-pattern';
import type { MenuItem, MenuProps } from '@/types/menu.types';
import type { ReactElement } from 'react';

/** A native iOS pull-down menu that opens on tap, like the web dropdown menu. */
export function Menu({ title, items, children, isFullWidth = false, isDisabled = false }: MenuProps) {
  return (
    <MenuTrigger
      isFullWidth={isFullWidth}
      render={(trigger) => (
        <Host matchContents>
          <SwiftMenu label={<RNHostView matchContents>{trigger}</RNHostView>} modifiers={[menuStyle('button'), buttonStyle('plain'), menuIndicator('hidden'), disabled(isDisabled)]}>
            <MenuContent items={items} title={title} />
          </SwiftMenu>
        </Host>
      )}
    >
      {children}
    </MenuTrigger>
  );
}

/** The same menu opened by a long press: the view lifts as a preview and the menu shows under it. */
export function ContextMenu({ title, items, children, isFullWidth = false }: MenuProps) {
  return (
    <MenuTrigger
      isFullWidth={isFullWidth}
      render={(trigger) => (
        <Host matchContents>
          <SwiftContextMenu>
            <SwiftContextMenu.Items>
              <MenuContent items={items} title={title} />
            </SwiftContextMenu.Items>
            <SwiftContextMenu.Trigger>
              <RNHostView matchContents>{trigger}</RNHostView>
            </SwiftContextMenu.Trigger>
          </SwiftContextMenu>
        </Host>
      )}
    >
      {children}
    </MenuTrigger>
  );
}

interface MenuTriggerProps {
  isFullWidth: boolean;
  children: ReactElement;
  render: (trigger: ReactElement) => ReactElement;
}

/** A hosted SwiftUI view sizes to its content, so a full-width trigger is measured first and then pinned to that width. */
function MenuTrigger({ isFullWidth, children, render }: MenuTriggerProps) {
  const [width, setWidth] = useState<number>();

  return match({ isFullWidth, width })
    .with({ isFullWidth: false }, () => render(children))
    .with({ width: P.number }, ({ width: rowWidth }) => render(<View style={{ width: rowWidth }}>{children}</View>))
    .otherwise(() => <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>{children}</View>);
}

interface MenuContentProps {
  title?: string;
  items: MenuItem[];
}

/** A title shows as the small muted header of a native menu section. */
function MenuContent({ title, items }: MenuContentProps) {
  return match(title)
    .with(P.string, (header) => (
      <Section title={header}>
        <MenuItems items={items} />
      </Section>
    ))
    .otherwise(() => <MenuItems items={items} />);
}

interface MenuItemsProps {
  items: MenuItem[];
}

function MenuItems({ items }: MenuItemsProps) {
  return items.map((item) => (
    <Fragment key={item.label}>
      {item.hasDividerBefore ? <Divider /> : null}
      {match(item.items)
        .with(P.nonNullable, (children) => (
          <SwiftMenu label={item.label} systemImage={item.systemImage}>
            <MenuItems items={children} />
          </SwiftMenu>
        ))
        .otherwise(() => (
          <Button
            label={item.label}
            role={item.isDestructive ? 'destructive' : 'default'}
            systemImage={item.systemImage}
            onPress={item.onSelect}
          />
        ))}
    </Fragment>
  ));
}
