import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ActivityInput, AiConversation, AiConversationInput, AiConversationWithMessages, AiMessage, AiMessageInput, BotStatus, ErrorResponse, GetModerationStatsParams, Guild, HealthStatus, ListModerationActionsParams, ModerationAction, ModerationActionInput, ModerationStats, RotationConfig } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetBotStatusUrl: () => string;
/**
 * @summary Get bot status and current activity
 */
export declare const getBotStatus: (options?: Parameters<typeof customFetch>[1]) => Promise<BotStatus>;
export declare const getGetBotStatusQueryKey: () => readonly ["/api/bot/status"];
export declare const getGetBotStatusQueryOptions: <TData = Awaited<ReturnType<typeof getBotStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBotStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBotStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getBotStatus>>>;
export type GetBotStatusQueryError = ErrorType<unknown>;
/**
 * @summary Get bot status and current activity
 */
export declare function useGetBotStatus<TData = Awaited<ReturnType<typeof getBotStatus>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSetBotActivityUrl: () => string;
/**
 * @summary Set bot activity status
 */
export declare const setBotActivity: (activityInput: ActivityInput, options?: Parameters<typeof customFetch>[1]) => Promise<BotStatus>;
export declare const getSetBotActivityMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setBotActivity>>, TError, {
        data: BodyType<ActivityInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof setBotActivity>>, TError, {
    data: BodyType<ActivityInput>;
}, TContext>;
export type SetBotActivityMutationResult = NonNullable<Awaited<ReturnType<typeof setBotActivity>>>;
export type SetBotActivityMutationBody = BodyType<ActivityInput>;
export type SetBotActivityMutationError = ErrorType<unknown>;
/**
* @summary Set bot activity status
*/
export declare const useSetBotActivity: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setBotActivity>>, TError, {
        data: BodyType<ActivityInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof setBotActivity>>, TError, {
    data: BodyType<ActivityInput>;
}, TContext>;
export declare const getGetBotRotationUrl: () => string;
/**
 * @summary Get current status rotation config
 */
export declare const getBotRotation: (options?: Parameters<typeof customFetch>[1]) => Promise<RotationConfig>;
export declare const getGetBotRotationQueryKey: () => readonly ["/api/bot/rotation"];
export declare const getGetBotRotationQueryOptions: <TData = Awaited<ReturnType<typeof getBotRotation>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotRotation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBotRotation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBotRotationQueryResult = NonNullable<Awaited<ReturnType<typeof getBotRotation>>>;
export type GetBotRotationQueryError = ErrorType<unknown>;
/**
 * @summary Get current status rotation config
 */
export declare function useGetBotRotation<TData = Awaited<ReturnType<typeof getBotRotation>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBotRotation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSetBotRotationUrl: () => string;
/**
 * @summary Set status rotation config
 */
export declare const setBotRotation: (rotationConfig: RotationConfig, options?: Parameters<typeof customFetch>[1]) => Promise<RotationConfig>;
export declare const getSetBotRotationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setBotRotation>>, TError, {
        data: BodyType<RotationConfig>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof setBotRotation>>, TError, {
    data: BodyType<RotationConfig>;
}, TContext>;
export type SetBotRotationMutationResult = NonNullable<Awaited<ReturnType<typeof setBotRotation>>>;
export type SetBotRotationMutationBody = BodyType<RotationConfig>;
export type SetBotRotationMutationError = ErrorType<unknown>;
/**
* @summary Set status rotation config
*/
export declare const useSetBotRotation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setBotRotation>>, TError, {
        data: BodyType<RotationConfig>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof setBotRotation>>, TError, {
    data: BodyType<RotationConfig>;
}, TContext>;
export declare const getListBotGuildsUrl: () => string;
/**
 * @summary List all servers the bot is in
 */
export declare const listBotGuilds: (options?: Parameters<typeof customFetch>[1]) => Promise<Guild[]>;
export declare const getListBotGuildsQueryKey: () => readonly ["/api/bot/guilds"];
export declare const getListBotGuildsQueryOptions: <TData = Awaited<ReturnType<typeof listBotGuilds>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBotGuilds>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listBotGuilds>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListBotGuildsQueryResult = NonNullable<Awaited<ReturnType<typeof listBotGuilds>>>;
export type ListBotGuildsQueryError = ErrorType<unknown>;
/**
 * @summary List all servers the bot is in
 */
export declare function useListBotGuilds<TData = Awaited<ReturnType<typeof listBotGuilds>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listBotGuilds>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListModerationActionsUrl: (params?: ListModerationActionsParams) => string;
/**
 * @summary List all moderation actions
 */
export declare const listModerationActions: (params?: ListModerationActionsParams, options?: Parameters<typeof customFetch>[1]) => Promise<ModerationAction[]>;
export declare const getListModerationActionsQueryKey: (params?: ListModerationActionsParams) => readonly ["/api/moderation/actions", ...ListModerationActionsParams[]];
export declare const getListModerationActionsQueryOptions: <TData = Awaited<ReturnType<typeof listModerationActions>>, TError = ErrorType<unknown>>(params?: ListModerationActionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModerationActions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listModerationActions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListModerationActionsQueryResult = NonNullable<Awaited<ReturnType<typeof listModerationActions>>>;
export type ListModerationActionsQueryError = ErrorType<unknown>;
/**
 * @summary List all moderation actions
 */
export declare function useListModerationActions<TData = Awaited<ReturnType<typeof listModerationActions>>, TError = ErrorType<unknown>>(params?: ListModerationActionsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listModerationActions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateModerationActionUrl: () => string;
/**
 * @summary Log a moderation action
 */
export declare const createModerationAction: (moderationActionInput: ModerationActionInput, options?: Parameters<typeof customFetch>[1]) => Promise<ModerationAction>;
export declare const getCreateModerationActionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createModerationAction>>, TError, {
        data: BodyType<ModerationActionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createModerationAction>>, TError, {
    data: BodyType<ModerationActionInput>;
}, TContext>;
export type CreateModerationActionMutationResult = NonNullable<Awaited<ReturnType<typeof createModerationAction>>>;
export type CreateModerationActionMutationBody = BodyType<ModerationActionInput>;
export type CreateModerationActionMutationError = ErrorType<unknown>;
/**
* @summary Log a moderation action
*/
export declare const useCreateModerationAction: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createModerationAction>>, TError, {
        data: BodyType<ModerationActionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createModerationAction>>, TError, {
    data: BodyType<ModerationActionInput>;
}, TContext>;
export declare const getDeleteModerationActionUrl: (id: number) => string;
/**
 * @summary Delete a moderation action record
 */
export declare const deleteModerationAction: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeleteModerationActionMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteModerationAction>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteModerationAction>>, TError, {
    id: number;
}, TContext>;
export type DeleteModerationActionMutationResult = NonNullable<Awaited<ReturnType<typeof deleteModerationAction>>>;
export type DeleteModerationActionMutationError = ErrorType<ErrorResponse>;
/**
* @summary Delete a moderation action record
*/
export declare const useDeleteModerationAction: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteModerationAction>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteModerationAction>>, TError, {
    id: number;
}, TContext>;
export declare const getGetModerationStatsUrl: (params?: GetModerationStatsParams) => string;
/**
 * @summary Get moderation statistics (counts by action type)
 */
export declare const getModerationStats: (params?: GetModerationStatsParams, options?: Parameters<typeof customFetch>[1]) => Promise<ModerationStats>;
export declare const getGetModerationStatsQueryKey: (params?: GetModerationStatsParams) => readonly ["/api/moderation/stats", ...GetModerationStatsParams[]];
export declare const getGetModerationStatsQueryOptions: <TData = Awaited<ReturnType<typeof getModerationStats>>, TError = ErrorType<unknown>>(params?: GetModerationStatsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModerationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getModerationStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetModerationStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getModerationStats>>>;
export type GetModerationStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get moderation statistics (counts by action type)
 */
export declare function useGetModerationStats<TData = Awaited<ReturnType<typeof getModerationStats>>, TError = ErrorType<unknown>>(params?: GetModerationStatsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModerationStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAiConversationsUrl: () => string;
/**
 * @summary List AI chat conversations
 */
export declare const listAiConversations: (options?: Parameters<typeof customFetch>[1]) => Promise<AiConversation[]>;
export declare const getListAiConversationsQueryKey: () => readonly ["/api/ai/conversations"];
export declare const getListAiConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listAiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAiConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAiConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listAiConversations>>>;
export type ListAiConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List AI chat conversations
 */
export declare function useListAiConversations<TData = Awaited<ReturnType<typeof listAiConversations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAiConversationUrl: () => string;
/**
 * @summary Create a new AI conversation
 */
export declare const createAiConversation: (aiConversationInput: AiConversationInput, options?: Parameters<typeof customFetch>[1]) => Promise<AiConversation>;
export declare const getCreateAiConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAiConversation>>, TError, {
        data: BodyType<AiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAiConversation>>, TError, {
    data: BodyType<AiConversationInput>;
}, TContext>;
export type CreateAiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createAiConversation>>>;
export type CreateAiConversationMutationBody = BodyType<AiConversationInput>;
export type CreateAiConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new AI conversation
*/
export declare const useCreateAiConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAiConversation>>, TError, {
        data: BodyType<AiConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAiConversation>>, TError, {
    data: BodyType<AiConversationInput>;
}, TContext>;
export declare const getGetAiConversationUrl: (id: number) => string;
/**
 * @summary Get a conversation with its messages
 */
export declare const getAiConversation: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<AiConversationWithMessages>;
export declare const getGetAiConversationQueryKey: (id: number) => readonly [`/api/ai/conversations/${number}`];
export declare const getGetAiConversationQueryOptions: <TData = Awaited<ReturnType<typeof getAiConversation>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAiConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAiConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getAiConversation>>>;
export type GetAiConversationQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a conversation with its messages
 */
export declare function useGetAiConversation<TData = Awaited<ReturnType<typeof getAiConversation>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteAiConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteAiConversation: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeleteAiConversationMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAiConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteAiConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAiConversation>>>;
export type DeleteAiConversationMutationError = ErrorType<ErrorResponse>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteAiConversation: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAiConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAiConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getListAiMessagesUrl: (id: number) => string;
/**
 * @summary List messages in a conversation
 */
export declare const listAiMessages: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<AiMessage[]>;
export declare const getListAiMessagesQueryKey: (id: number) => readonly [`/api/ai/conversations/${number}/messages`];
export declare const getListAiMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listAiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAiMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAiMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listAiMessages>>>;
export type ListAiMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List messages in a conversation
 */
export declare function useListAiMessages<TData = Awaited<ReturnType<typeof listAiMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAiMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendAiMessageUrl: (id: number) => string;
/**
 * @summary Send a message (returns SSE stream)
 */
export declare const sendAiMessage: (id: number, aiMessageInput: AiMessageInput, options?: Parameters<typeof customFetch>[1]) => Promise<unknown>;
export declare const getSendAiMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendAiMessage>>, TError, {
        id: number;
        data: BodyType<AiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendAiMessage>>, TError, {
    id: number;
    data: BodyType<AiMessageInput>;
}, TContext>;
export type SendAiMessageMutationResult = NonNullable<Awaited<ReturnType<typeof sendAiMessage>>>;
export type SendAiMessageMutationBody = BodyType<AiMessageInput>;
export type SendAiMessageMutationError = ErrorType<unknown>;
/**
* @summary Send a message (returns SSE stream)
*/
export declare const useSendAiMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendAiMessage>>, TError, {
        id: number;
        data: BodyType<AiMessageInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendAiMessage>>, TError, {
    id: number;
    data: BodyType<AiMessageInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map