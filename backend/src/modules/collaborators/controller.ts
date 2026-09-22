import { Response, NextFunction } from 'express';
import * as collaboratorService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function addCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collaborator = await collaboratorService.addCollaborator(req.body);
    res.status(201).json({ data: collaborator });
  } catch (err) {
    next(err);
  }
}

export async function getCollaborators(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collaborators = await collaboratorService.getProjectCollaborators(req.params.projectId as string);
    res.status(200).json({ data: collaborators });
  } catch (err) {
    next(err);
  }
}

export async function updateCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const collaborator = await collaboratorService.updateCollaborator(req.params.id as string, req.body);
    res.status(200).json({ data: collaborator });
  } catch (err) {
    next(err);
  }
}

export async function removeCollaborator(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await collaboratorService.removeCollaborator(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
