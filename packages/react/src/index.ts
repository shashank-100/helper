export { HelperWidgetScript, type HelperWidgetScriptProps } from "./components/helperWidgetScript";
export {
  HelperClientProvider,
  type HelperClientProviderProps,
  useHelperClient,
} from "./components/helperClientProvider";
export { useHelper } from "./hooks/useHelper";
export {
  useConversations,
  useConversation,
  useUnreadConversationsCount,
  useCreateConversation,
  useUpdateConversation,
  useCreateMessage,
} from "./hooks/useConversations";
export { useCreateSession } from "./hooks/useSession";
export { useChat, type UseChatProps, useRealtimeEvents } from "./hooks/useChat";
export { MessageContent } from "./components/messageContent";

export * from "./types";
