import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import * as collaboratorService from './service';

/**
 * POST /collaborators
 * Body: { projectId, invitedEmail, role, splitPercentage }
 */
export async function createCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await collaboratorService.createInvitation(userId, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /collaborators/project/:projectId
 */
export async function getProjectCollaborators(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const result = await collaboratorService.getProjectCollaborators(projectId as string, req.user!.id);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /collaborators/:id
 * Revokes an invitation or removes a pool member.
 */
export async function removeCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await collaboratorService.removeCollaborator(req.params.id as string, userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
