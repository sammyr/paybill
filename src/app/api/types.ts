import { NextRequest } from 'next/server';

export type RouteHandler<T> = (
  request: NextRequest,
  context: { params: T }
) => Promise<Response>;

export interface InvoiceParams {
  id: string;
}
