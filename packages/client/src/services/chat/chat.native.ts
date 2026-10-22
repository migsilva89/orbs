import { Errors } from '@repo/errors/universal';
import type { ChatPicked } from '../../types/chat.types';

/** Reads a picked photo or file from its local uri as an uploadable File. */
export function chatReadPicked({ uri, name }: Pick<ChatPicked, 'uri' | 'name'>): Promise<File> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.responseType = 'blob';
    request.onload = () => {
      // SAFETY: a 'blob' XHR response is a native Blob; an own writable `name` survives Expo's FormData, unlike `File.name`.
      resolve(Object.defineProperty(request.response as Blob, 'name', { value: name, writable: true }) as File);
    };
    request.onerror = () => reject(new Errors.INTERNAL_ERROR({ internal: `Could not read ${uri}` }));
    request.open('GET', uri);
    request.send();
  });
}
