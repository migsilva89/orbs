import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

export function useSettingsSources() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const skills = useQuery(rpc.skills.settings.queryOptions());
  const instructions = useQuery(rpc.instructions.settings.queryOptions());
  const plugins = useQuery(rpc.plugins.settings.queryOptions());
  const mcp = useQuery(rpc.mcp.settings.queryOptions());

  const saveSkills = useMutation(rpc.skills.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.skills.settings.queryKey(), saved),
  }));

  const saveInstructions = useMutation(rpc.instructions.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.instructions.settings.queryKey(), saved),
  }));

  const savePlugins = useMutation(rpc.plugins.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.plugins.settings.queryKey(), saved),
  }));

  const saveMcp = useMutation(rpc.mcp.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.mcp.settings.queryKey(), saved),
  }));

  return {
    isLoading: skills.isPending || instructions.isPending || plugins.isPending || mcp.isPending,
    skills: {
      paths: skills.data?.directories ?? [],
      isPending: saveSkills.isPending,
      isFailed: saveSkills.isError,
      save: (directories: string[]) => saveSkills.mutate({ directories }),
    },
    instructions: {
      paths: instructions.data?.paths ?? [],
      isPending: saveInstructions.isPending,
      isFailed: saveInstructions.isError,
      save: (paths: string[]) => saveInstructions.mutate({ paths }),
    },
    plugins: {
      paths: plugins.data?.directories ?? [],
      isPending: savePlugins.isPending,
      isFailed: savePlugins.isError,
      save: (directories: string[]) => savePlugins.mutate({ directories }),
    },
    mcp: {
      paths: mcp.data?.paths ?? [],
      isPending: saveMcp.isPending,
      isFailed: saveMcp.isError,
      save: (paths: string[]) => saveMcp.mutate({ paths }),
    },
  };
}
