import type {
  DefaultError,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query'

type MutationFunctionContext = unknown

export type UseCustomQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>

export type UseCustomMutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError' | 'onSettled'> & {
  onSuccess?: {
    (data: TData, variables: TVariables, context: TContext): unknown
    (
      data: TData,
      variables: TVariables,
      onMutateResult: TContext,
      context: MutationFunctionContext
    ): unknown
  }
  onError?: {
    (error: TError, variables: TVariables, context: TContext): unknown
    (
      error: TError,
      variables: TVariables,
      onMutateResult: TContext | undefined,
      context: MutationFunctionContext
    ): unknown
  }
  onSettled?: {
    (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext): unknown
    (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
      onMutateResult: TContext | undefined,
      context: MutationFunctionContext
    ): unknown
  }
}

export type UseCustomInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey' | 'getNextPageParam' | 'initialPageParam'
>
