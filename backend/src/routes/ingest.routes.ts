import { Router } from 'express'
import { resolveProjectToken } from '../middleware/projectToken.middleware.js'
import { track, importBatch, engage, groups } from '../controllers/ingest.controller.js'

const router = Router()

router.post('/track', resolveProjectToken, track)
router.get('/track', resolveProjectToken, track) // Mixpanel also supports GET
router.post('/import', resolveProjectToken, importBatch)
router.post('/engage', resolveProjectToken, engage)
router.get('/engage', resolveProjectToken, engage)
router.post('/groups', resolveProjectToken, groups)

export default router
