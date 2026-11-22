import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  scopeType: 'ALL' | 'UNIVERSITY' | 'PROGRAM' | 'COURSE';
  scopeTargetName: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  publishedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  scopeType: 'ALL' | 'UNIVERSITY' | 'PROGRAM' | 'COURSE';
  scopeTargetName: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt: string;
}

@Injectable()
export class AnnouncementsService {
  private readonly storagePath = path.resolve(
    process.cwd(),
    'data/announcements.json'
  );
  private announcements: AnnouncementRecord[] = [];

  constructor(private readonly auditService: AuditService) {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf-8');
        this.announcements = JSON.parse(data);
      } else {
        // Default initial announcements if file does not exist yet
        this.announcements = [
          {
            id: 'ann-init-1',
            title: 'First Semester Mid Exams Schedule Released',
            body: 'All university freshman students: Mid examinations schedule has been uploaded. Ensure your course modules and offline quizzes are downloaded on your device.',
            scopeType: 'ALL',
            scopeTargetName: 'All Students',
            priority: 'HIGH',
            isActive: true,
            publishedAt: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] ?? '',
            expiresAt: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ann-init-2',
            title: 'New Amharic Notes Available for Calculus & Physics',
            body: 'Supplemental Amharic study notes and rapid reference summaries have been published for Applied Mathematics I and General Physics.',
            scopeType: 'ALL',
            scopeTargetName: 'All Students',
            priority: 'NORMAL',
            isActive: true,
            publishedAt: new Date(Date.now() - 86400000).toISOString().split('T')[0] ?? '',
            expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        this.saveToDisk();
      }
    } catch (err) {
      console.error('Failed to load announcements from disk:', err);
      this.announcements = [];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.announcements, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save announcements to disk:', err);
    }
  }

  async listAnnouncements(options?: {
    scopeType?: string;
    activeOnly?: boolean;
  }): Promise<AnnouncementRecord[]> {
    let list = [...this.announcements];
    if (options?.activeOnly) {
      const today = new Date().toISOString().split('T')[0] ?? '';
      list = list.filter(
        (a) => a.isActive && (!a.expiresAt || a.expiresAt >= today)
      );
    }
    if (options?.scopeType && options.scopeType !== 'ALL') {
      list = list.filter((a) => a.scopeType === options.scopeType || a.scopeType === 'ALL');
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAnnouncementById(id: string): Promise<AnnouncementRecord | null> {
    return this.announcements.find((a) => a.id === id) || null;
  }

  async createAnnouncement(
    actor: AuthenticatedAdminContext,
    input: CreateAnnouncementInput
  ): Promise<AnnouncementRecord> {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title || !body) {
      throw new Error('Announcement title and message body are required.');
    }

    const now = new Date();
    const record: AnnouncementRecord = {
      id: `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      scopeType: input.scopeType || 'ALL',
      scopeTargetName: input.scopeTargetName || 'All Students',
      priority: input.priority || 'NORMAL',
      isActive: true,
      publishedAt: now.toISOString().split('T')[0] || '',
      expiresAt:
        input.expiresAt ||
        (new Date(now.getTime() + 86400000 * 30).toISOString().split('T')[0] ??
          ''),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.announcements.unshift(record);
    this.saveToDisk();

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'ANNOUNCEMENT_CREATED',
      resourceType: 'ANNOUNCEMENT',
      resourceId: record.id,
      newValue: {
        title: record.title,
        scopeType: record.scopeType,
        priority: record.priority,
      },
    });

    return record;
  }

  async updateAnnouncement(
    actor: AuthenticatedAdminContext,
    id: string,
    patch: Partial<CreateAnnouncementInput> & { isActive?: boolean }
  ): Promise<AnnouncementRecord> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Announcement with id "${id}" not found.`);
    }

    const existing = this.announcements[index]!;
    const updated: AnnouncementRecord = {
      ...existing,
      title: patch.title !== undefined ? patch.title.trim() : existing.title,
      body: patch.body !== undefined ? patch.body.trim() : existing.body,
      scopeType: patch.scopeType ?? existing.scopeType,
      scopeTargetName: patch.scopeTargetName ?? existing.scopeTargetName,
      priority: patch.priority ?? existing.priority,
      isActive: patch.isActive !== undefined ? patch.isActive : existing.isActive,
      expiresAt: patch.expiresAt ?? existing.expiresAt,
      updatedAt: new Date().toISOString(),
    };

    this.announcements[index] = updated;
    this.saveToDisk();

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'ANNOUNCEMENT_UPDATED',
      resourceType: 'ANNOUNCEMENT',
      resourceId: updated.id,
      previousValue: { isActive: existing.isActive, priority: existing.priority },
      newValue: { isActive: updated.isActive, priority: updated.priority },
    });

    return updated;
  }

  async deleteAnnouncement(
    actor: AuthenticatedAdminContext,
    id: string
  ): Promise<{ success: boolean }> {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Announcement with id "${id}" not found.`);
    }

    const [deleted] = this.announcements.splice(index, 1);
    this.saveToDisk();

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'ANNOUNCEMENT_DELETED',
      resourceType: 'ANNOUNCEMENT',
      resourceId: id,
      previousValue: { title: deleted?.title },
    });

    return { success: true };
  }
}
