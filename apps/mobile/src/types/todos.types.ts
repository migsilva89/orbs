export interface TodosDeleteRouteParams extends Record<string, string | string[] | undefined> {
  botId: string;
  todoId: string;
  title: string;
}
