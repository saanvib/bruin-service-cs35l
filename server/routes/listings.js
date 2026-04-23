import { Router } from 'express'
const router = Router()

router.get('/',    (req, res) => res.json({ message: 'TODO' }))
router.get('/:id', (req, res) => res.json({ message: 'TODO' }))

export default router
