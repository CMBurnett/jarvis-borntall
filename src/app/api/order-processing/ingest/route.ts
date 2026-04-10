/**
 * POST /api/order-processing/ingest
 *
 * Triggers the full ingestion pipeline:
 * 1. Fetch UNSEEN emails via IMAP
 * 2. OCR any PDF/image attachments
 * 3. Pull Sage customer context from the Python sidecar
 * 4. Extract fields via Ollama LLM
 * 5. Run SKU matching against pgvector catalog
 * 6. Write op_orders + op_line_items to Supabase
 *
 * Called by the UI's "Manual ingest" button or a scheduled job.
 * Can also accept a raw email body in the request for manual testing.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { fetchUnseenEmails } from '@order-processing/lib/ingestion/imap'
import { fetchMailpitEmails } from '@order-processing/lib/ingestion/mailpit'
import { parseEmail, combineEmailContent } from '@order-processing/lib/ingestion/parser'
import { extractTextFromAttachment } from '@order-processing/lib/ingestion/ocr'
import { extractOrderFields } from '@order-processing/lib/extraction/extractor'
import { rollUpConfidence } from '@order-processing/lib/extraction/confidence'
import { getSageCustomerContext } from '@order-processing/lib/matching/sage-context'
import { matchSku } from '@order-processing/lib/matching/sku-matcher'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get org_id for the current user
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const org_id = profile?.org_id
  if (!org_id) return NextResponse.json({ error: 'No org_id for user' }, { status: 400 })

  const contentType = req.headers.get('content-type') ?? ''

  type AttachmentFile = { name: string; buffer: Buffer; contentType: string }
  const rawEmails: { uid: string; raw: Buffer; isManual?: boolean; attachmentFiles?: AttachmentFile[] }[] = []

  if (contentType.includes('multipart/form-data')) {
    // Manual upload: email text + optional file attachments (PDFs, images, .eml, .txt)
    const formData = await req.formData()
    const rawEmailText = (formData.get('raw_email') as string | null)?.trim() ?? ''
    const files = formData.getAll('files') as File[]

    const parts: string[] = []
    const attachmentFiles: AttachmentFile[] = []
    if (rawEmailText) parts.push(rawEmailText)

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      attachmentFiles.push({ name: file.name, buffer, contentType: file.type || 'application/octet-stream' })
      const text = await extractTextFromAttachment(buffer, file.type || 'application/octet-stream')
      if (text?.trim()) {
        parts.push(`=== ATTACHMENT: ${file.name} ===\n${text.trim()}`)
      }
    }

    if (parts.length > 0) {
      rawEmails.push({ uid: 'manual', raw: Buffer.from(parts.join('\n\n')), isManual: true, attachmentFiles })
    }
  } else {
    // JSON body or empty → poll IMAP / Mailpit
    const body = await req.json().catch(() => null)
    if (body?.raw_email) {
      rawEmails.push({ uid: 'manual', raw: Buffer.from(body.raw_email as string), isManual: true })
    } else if (process.env.IMAP_HOST) {
      try {
        const fetched = await fetchUnseenEmails()
        rawEmails.push(...fetched)
      } catch (e: unknown) {
        console.error('[ingest] IMAP fetch failed:', e)
      }
    } else {
      const fetched = await fetchMailpitEmails()
      rawEmails.push(...fetched)
    }
  }

  const results: { order_id: string; status: string }[] = []

  for (const { uid, raw, isManual, attachmentFiles } of rawEmails) {
    let orderId: string | undefined
    try {
      const email = await parseEmail(raw)
      console.log(`[ingest] Email "${email.subject}" — ${email.attachments.length} attachment(s)`)
      for (const att of email.attachments) {
        console.log(`[ingest]   ${att.filename} (${att.content_type}, ${att.content.length} bytes)`)
      }

      // OCR all attachments
      const attachmentTexts = await Promise.all(
        email.attachments.map((att) =>
          extractTextFromAttachment(att.content, att.content_type)
        )
      )
      for (let i = 0; i < attachmentTexts.length; i++) {
        console.log(`[ingest]   OCR result for ${email.attachments[i].filename}: ${attachmentTexts[i].length} chars`)
      }

      const emailContent = combineEmailContent(email, attachmentTexts)
      console.log(`[ingest] Combined content: ${emailContent.length} chars`)

      // Create order row (pending_extraction)
      const { data: orderRow } = await admin
        .from('op_orders')
        .insert({
          org_id,
          status: 'pending_extraction',
          source: isManual ? 'manual' : 'email',
          raw_email: emailContent,
          received_at: email.date,
        })
        .select('id')
        .single()

      if (!orderRow) continue
      orderId = orderRow.id

      // Upload attachment files to Supabase Storage
      const filesToStore: Array<{ name: string; buffer: Buffer; contentType: string }> = isManual
        ? (attachmentFiles ?? [])
        : email.attachments.map((a) => ({ name: a.filename, buffer: a.content, contentType: a.content_type }))

      if (filesToStore.length > 0) {
        await admin.storage.createBucket('op-attachments', { public: false }).catch(() => {})
        const attachmentMeta: Array<{ filename: string; path: string; content_type: string }> = []
        for (const file of filesToStore) {
          const storagePath = `${orderId}/${file.name}`
          const { error: uploadErr } = await admin.storage
            .from('op-attachments')
            .upload(storagePath, file.buffer, { contentType: file.contentType, upsert: true })
          if (!uploadErr) {
            attachmentMeta.push({ filename: file.name, path: storagePath, content_type: file.contentType })
          }
        }
        if (attachmentMeta.length > 0) {
          await admin.from('op_orders').update({ attachments: attachmentMeta }).eq('id', orderId)
        }
      }

      await admin.from('op_audit_log').insert({
        order_id: orderId,
        actor: 'system',
        action: 'ingested',
        payload: { uid, from: email.from, subject: email.subject },
      })

      // LLM extraction (with customer context if available)
      // First pass: extract customer name to look up Sage history
      const prelimResult = await extractOrderFields(emailContent, null)
      const customerName = prelimResult.customer_name.value
      const sageContext = customerName ? await getSageCustomerContext(customerName) : null

      // Second pass: extraction with full customer context
      const extraction = customerName && sageContext
        ? await extractOrderFields(emailContent, sageContext)
        : prelimResult

      const overallConfidence = rollUpConfidence(extraction)

      await admin.from('op_orders').update({
        status: 'pending_review',
        customer_name: extraction.customer_name.value,
        po_number: extraction.po_number.value,
        delivery_date: extraction.requested_delivery_date.value,
        shipping_address: extraction.shipping_address.value,
        special_instructions: extraction.special_instructions.value,
        extraction_confidence: overallConfidence,
        field_confidence: {
          customer_name: extraction.customer_name.confidence,
          po_number: extraction.po_number.confidence,
          requested_delivery_date: extraction.requested_delivery_date.confidence,
          shipping_address: extraction.shipping_address.confidence,
          special_instructions: extraction.special_instructions.confidence,
        },
        sage_customer_no: sageContext?.customer_no ?? null,
        updated_at: new Date().toISOString(),
      }).eq('id', orderId)

      await admin.from('op_audit_log').insert({
        order_id: orderId,
        actor: 'system',
        action: 'extraction_complete',
        payload: { confidence: overallConfidence, fields_extracted: Object.keys(extraction).length },
      })

      // SKU matching — non-fatal, falls back to 'unmatched' if embeddings unavailable
      for (let i = 0; i < extraction.line_items.length; i++) {
        const li = extraction.line_items[i]
        let match = { auto_sku: null, candidates: [], match_status: 'unmatched' as const }
        try {
          const matchText = [li.description, li.sku_guess].filter(Boolean).join(' ')
          match = await matchSku(matchText)
        } catch { /* embeddings unavailable — reviewer will assign SKU manually */ }

        await admin.from('op_line_items').insert({
          order_id: orderId,
          raw_text: li.raw_text,
          quantity: li.quantity.value,
          unit: li.unit.value,
          description: li.description,
          confidence: li.quantity.confidence === 'LOW' || li.unit.confidence === 'LOW' ? 'LOW' : 'MEDIUM',
          sku_matched: match.auto_sku,
          sku_candidates: match.candidates,
          sku_match_status: match.match_status,
          unit_price: li.unit_price,
          line_total: li.line_total,
          sort_order: i,
        })
      }

      await admin.from('op_audit_log').insert({
        order_id: orderId,
        actor: 'system',
        action: 'sku_matched',
        payload: { line_items: extraction.line_items.length },
      })

      results.push({ order_id: orderId, status: 'pending_review' })
    } catch (err) {
      results.push({ order_id: orderId ?? uid, status: `error: ${String(err)}` })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
