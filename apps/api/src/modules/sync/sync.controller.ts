import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { StudentSyncPayloadDto, StudentSyncService } from './sync.service';

@Controller('sync')
export class StudentSyncController {
  constructor(private readonly syncService: StudentSyncService) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  async pushSync(@Body() payload: StudentSyncPayloadDto) {
    return this.syncService.processUpwardSync(payload);
  }
}
