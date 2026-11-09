export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export interface PaginatedQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}