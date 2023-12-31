import { useContext } from 'react';
import useSoundBase from 'use-sound';
import { HookOptions } from 'use-sound/dist/types';
import { ConfigContext } from '../providers/ConfigProvider';

export default function useSound<T = any>(
  url: string | string[],
  delegated?: HookOptions<T>
) {
  const { soundEnabled } = useContext(ConfigContext);

  return useSoundBase(url, { soundEnabled, ...delegated });
}
