import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  AnnouncementsService,
  CreateAnnouncementInput,
} from './announcements.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Get()
  async listAnnouncements(
    @Query('scopeType') scopeType?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const filter: { scopeType?: string; activeOnly?: boolean } = {};
    if (scopeType) filter.scopeType = scopeType;
    if (activeOnly !== undefined) filter.activeOnly = activeOnly === 'true';
    return this.service.listAnnouncements(filter);
  }

  @Get(':id')
  async getAnnouncement(@Param('id') id: string) {
    return this.service.getAnnouncementById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data: CreateAnnouncementInput;
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    return this.service.createAnnouncement(actor, body.data);
  }

  @Put(':id')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data: Partial<CreateAnnouncementInput> & { isActive?: boolean };
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    return this.service.updateAnnouncement(actor, id, body.data);
  }

  @Delete(':id')
  async deleteAnnouncement(
    @Param('id') id: string,
    @Body() body?: { actor?: AuthenticatedAdminContext }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.service.deleteAnnouncement(actor, id);
  }
}
