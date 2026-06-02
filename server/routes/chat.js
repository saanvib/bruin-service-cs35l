import { Router } from 'express'
import { sql } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// All chat routes require the user to be logged in
router.use(requireAuth)

// GET /api/chat/conversations
// Returns all conversations for the logged-in user (works for both customer and provider)
router.get('/conversations', async (req, res) => {
  const userId = req.user.token.sub
  try {
    const rows = await sql`
      SELECT
        c.id,
        c.customer_id,
        c.provider_id,
        c.listing_id,
        c.listing_name,
        c.created_at,
        -- grab the most recent message for preview
        (
          SELECT body FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT sender_name FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_sender_name,
        (
          SELECT created_at FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at
      FROM conversations c
      WHERE c.customer_id = ${userId} OR c.provider_id = ${userId}
      ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC
    `
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// POST /api/chat/conversations
// Starts a new conversation (customer initiates). If one already exists, returns it.
router.post('/conversations', async (req, res) => {
  const customerId = req.user.token.sub
  const customerName = req.user.token.name || req.user.token.email || 'Customer'
  const { providerId, listingId, listingName } = req.body

  if (!providerId || !listingId || !listingName) {
    return res.status(400).json({ error: 'providerId, listingId, and listingName are required' })
  }

  try {
    // Use INSERT ... ON CONFLICT to safely get-or-create the conversation
    const [conversation] = await sql`
      INSERT INTO conversations (customer_id, provider_id, listing_id, listing_name)
      VALUES (${customerId}, ${providerId}, ${listingId}, ${listingName})
      ON CONFLICT (customer_id, provider_id, listing_id) DO UPDATE
        SET listing_name = EXCLUDED.listing_name
      RETURNING *
    `
    res.status(201).json(conversation)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// GET /api/chat/conversations/:id/messages
// Returns all messages in a conversation (only participants can read)
router.get('/conversations/:id/messages', async (req, res) => {
  const userId = req.user.token.sub
  try {
    // First verify this user is a participant
    const [conversation] = await sql`
      SELECT * FROM conversations WHERE id = ${req.params.id}
    `
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.customer_id !== userId && conversation.provider_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const messages = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${req.params.id}
      ORDER BY created_at ASC
    `
    res.json(messages)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/chat/conversations/:id/messages
// Sends a message in a conversation (only participants can send)
router.post('/conversations/:id/messages', async (req, res) => {
  const userId = req.user.token.sub
  const senderName = req.user.token.name || req.user.token.email || 'User'
  const { body } = req.body

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Message body cannot be empty' })
  }

  try {
    // Verify this user is a participant
    const [conversation] = await sql`
      SELECT * FROM conversations WHERE id = ${req.params.id}
    `
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })
    if (conversation.customer_id !== userId && conversation.provider_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const [message] = await sql`
      INSERT INTO messages (conversation_id, sender_id, sender_name, body)
      VALUES (${req.params.id}, ${userId}, ${senderName}, ${body.trim()})
      RETURNING *
    `
    res.status(201).json(message)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router