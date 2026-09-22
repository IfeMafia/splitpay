export interface CreateAuditLogDto {
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogResponse {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string | null;
  metadata: any | null;
  createdAt: Date;
}
