import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createProject,
  listProjects,
  getProject,
  issueServiceAccount,
} from '../controllers/project.controller.js'

const router = Router()

router.use(requireAuth)
router.post('/', createProject)
router.get('/', listProjects)
router.get('/:projectId', getProject)
router.post('/:projectId/service-accounts', issueServiceAccount)

export default router
