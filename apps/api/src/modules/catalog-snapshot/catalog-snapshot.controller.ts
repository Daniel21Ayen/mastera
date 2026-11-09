import { Controller, Get, Headers, Query, Res } from '@nestjs/common';
import { CatalogSnapshotService } from './catalog-snapshot.service';
import { CatalogSnapshotQueryDto } from '@mastera/contracts';

interface HttpResponseAdapter {
  status(code: number): HttpResponseAdapter;
  setHeader(name: string, value: string): void;
  send(body?: any): void;
  json(body: any): void;
}

@Controller('catalog')
export class CatalogSnapshotController {
  constructor(private readonly snapshotService: CatalogSnapshotService) {}

  @Get('snapshot')
  async getSnapshot(
    @Query() query: CatalogSnapshotQueryDto,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Headers('accept-encoding') acceptEncoding: string | undefined,
    @Res() res: HttpResponseAdapter
  ) {
    const result = await this.snapshotService.buildSnapshot(query, ifNoneMatch);

    res.setHeader('ETag', result.etag);
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');

    if (result.notModified) {
      return res.status(304).send();
    }

    if (acceptEncoding && acceptEncoding.includes('gzip') && result.gzipBuffer) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(result.gzipBuffer);
    }

    return res.status(200).json(result.payload);
  }

  @Get('delta')
  async getDelta(
    @Query() query: CatalogSnapshotQueryDto,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Headers('accept-encoding') acceptEncoding: string | undefined,
    @Res() res: HttpResponseAdapter
  ) {
    const result = await this.snapshotService.buildSnapshot(query, ifNoneMatch);

    res.setHeader('ETag', result.etag);
    res.setHeader('Cache-Control', 'private, no-cache');
    res.setHeader('X-Snapshot-Version', String(result.snapshotVersion));

    if (result.notModified) {
      return res.status(304).send();
    }

    if (acceptEncoding && acceptEncoding.includes('gzip') && result.gzipBuffer) {
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(result.gzipBuffer);
    }

    return res.status(200).json(result.payload);
  }
}
