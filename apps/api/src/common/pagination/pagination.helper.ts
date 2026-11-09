import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PaginatedQueryDto,
  PaginatedResponseDto,
} from '@mastera/contracts';

export interface NormalizedPaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function normalizePagination(
  query: PaginatedQueryDto
): NormalizedPaginationParams {
  const rawPage = Number(query.page ?? DEFAULT_PAGE);
  const rawPageSize = Number(query.pageSize ?? DEFAULT_PAGE_SIZE);

  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : DEFAULT_PAGE;
  const pageSize =
    Number.isInteger(rawPageSize) && rawPageSize >= 1
      ? Math.min(rawPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  params: NormalizedPaginationParams
): PaginatedResponseDto<T> {
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const effectivePage = Math.min(params.page, totalPages);

  return {
    items,
    page: effectivePage,
    pageSize: params.pageSize,
    total,
    totalPages,
  };
}