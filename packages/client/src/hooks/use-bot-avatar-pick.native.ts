import * as ImagePicker from 'expo-image-picker';
import { chatReadPicked } from '../services/chat/chat.native';
import { useBotAvatarUpload } from './use-bot-avatar-upload';
import type { BotAvatarImage } from '@openbots/contracts/universal';

/** Picks a square photo from the library and uploads it as a bot avatar; resolves null when the owner cancels. */
export function useBotAvatarPick() {
  const upload = useBotAvatarUpload();

  const pick = async (): Promise<BotAvatarImage | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    const asset = result.assets?.at(0);

    if (result.canceled || !asset) {
      return null;
    }

    const file = await chatReadPicked({ uri: asset.uri, name: asset.fileName ?? 'avatar.jpg' });

    return upload.mutateAsync({ file });
  };

  return { pick, isPending: upload.isPending };
}
