import { Router } from 'express'
const router = Router()

router.get('/',                 (req, res) => res.json({ message: 'TODO' }))
router.get('/:conversationId',  (req, res) => res.json({ message: 'TODO' }))
router.post('/:conversationId', (req, res) => res.json({ message: 'TODO' }))

export default router
