import { skillSettings } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Item, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { Text } from '@/components/ui/text';

interface SettingsPathListProps {
  title: string;
  placeholder: string;
  paths: string[];
  isPending: boolean;
  isFailed: boolean;
  onChange: (paths: string[]) => void;
}

export function SettingsPathList({ title, placeholder, paths, isPending, isFailed, onChange }: SettingsPathListProps) {
  const [draft, setDraft] = useState('');
  const path = skillSettings.shape.directories.element.safeParse(draft.trim());
  const isValid = path.success && !paths.includes(path.data);

  return (
    <Card size="sm">
      <Text variant="label">{title}</Text>
      <View className="flex-row items-center gap-2">
        <Input
          accessibilityLabel={title}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1"
          editable={!isPending}
          maxLength={4096}
          placeholder={placeholder}
          value={draft}
          onChangeText={setDraft}
        />
        <Button
          disabled={isPending || !isValid}
          variant="outline"
          onPress={() => {
            onChange([...paths, draft.trim()]);
            setDraft('');
          }}
        >
          {m.settings_paths_add()}
        </Button>
      </View>
      {isFailed ? <LabelDescription accessibilityRole="alert" variant="error">{m.settings_paths_error()}</LabelDescription> : null}
      {paths.length > 0 ? (
        <ItemGroup>
          {paths.map((item) => (
            <Item key={item} size="sm">
              <ItemContent>
                <ItemTitle numberOfLines={1}>{item}</ItemTitle>
              </ItemContent>
              <Button
                accessibilityLabel={m.settings_paths_delete()}
                disabled={isPending}
                size="icon-sm"
                variant="ghost"
                onPress={() => onChange(paths.filter((candidate) => candidate !== item))}
              >
                <Icon icon={Trash2} size="sm" />
              </Button>
            </Item>
          ))}
        </ItemGroup>
      ) : null}
    </Card>
  );
}
