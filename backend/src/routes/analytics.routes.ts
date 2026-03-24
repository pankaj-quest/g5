import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireProject } from '../middleware/requireProject.middleware.js'
import {
  getAvailableEvents,
  getProjectStats,
  getRecentEvents,
  insights,
  funnels,
  retention,
  flows,
  cohorts,
  exportEvents,
} from '../controllers/analytics.controller.js'
import { listPeople, getProfile } from '../controllers/people.controller.js'

const router = Router()

router.use(requireAuth)
router.use(requireProject)

router.get('/events', getAvailableEvents)
router.get('/recent-events', getRecentEvents)
router.get('/stats', getProjectStats)
router.get('/insights', insights)
router.post('/funnels', funnels)
router.get('/retention', retention)
router.get('/flows', flows)
router.get('/cohorts', cohorts)
router.post('/cohorts', cohorts)
router.get('/export', exportEvents)
router.get('/people', listPeople)
router.get('/people/:profileId', getProfile)

export default router
