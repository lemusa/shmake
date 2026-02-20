import { supabase } from './supabase'

const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n }

// ─── File Upload ─────────────────────────────────────────────────────────────

export async function uploadFile(file, folder = 'uploads') {
  try {
    const ext = file.name.split('.').pop()
    const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`
    const { error } = await supabase.storage.from('assets').upload(name, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(name)
    return publicUrl
  } catch (e) { console.error('uploadFile:', e); return null }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export async function resolveClientId(name) {
  if (!name) return null
  try {
    const { data } = await supabase.from('clients').select('id').eq('name', name).single()
    return data?.id ?? null
  } catch (e) { console.error('resolveClientId:', e); return null }
}

export async function resolveJobId(title) {
  if (!title) return null
  try {
    const { data } = await supabase.from('jobs').select('id').eq('title', title).single()
    return data?.id ?? null
  } catch (e) { console.error('resolveJobId:', e); return null }
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function listJobs() {
  try {
    const { data, error } = await supabase.from('jobs').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      t: r.title,
      clId: r.client_id,
      ty: r.type,
      st: r.status,
      pr: r.priority,
      v: r.value,
      due: r.due_date,
      n: r.internal_note || "",
    }))
  } catch (e) { console.error('listJobs:', e); return [] }
}

export async function createJob(d) {
  try {
    const client_id = await resolveClientId(d.cl)
    const { data, error } = await supabase.from('jobs').insert({
      title: d.t, client_id, type: d.ty, status: d.st,
      priority: d.pr, value: num(d.v), due_date: d.due || null,
      internal_note: d.n || null,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createJob:', e); return null }
}

export async function updateJob(id, d) {
  try {
    const updates = {}
    if (d.t !== undefined) updates.title = d.t
    if (d.cl !== undefined) updates.client_id = await resolveClientId(d.cl)
    if (d.ty !== undefined) updates.type = d.ty
    if (d.st !== undefined) updates.status = d.st
    if (d.pr !== undefined) updates.priority = d.pr
    if (d.v !== undefined) updates.value = num(d.v)
    if (d.due !== undefined) updates.due_date = d.due || null
    if (d.n !== undefined) updates.internal_note = d.n || null
    const { data, error } = await supabase.from('jobs').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateJob:', e); return null }
}

export async function deleteJob(id) {
  try {
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteJob:', e); return false }
}

// ─── Clients ────────────────────────────────────────────────────────────────

export async function listClients() {
  try {
    const [cRes, jRes, iRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('jobs').select('id, client_id'),
      supabase.from('invoices').select('client_id, amount, status'),
    ])
    if (cRes.error) throw cRes.error
    const clients = cRes.data || []
    const jobs = jRes.data || []
    const invoices = iRes.data || []

    const jobCounts = {}
    for (const j of jobs) { jobCounts[j.client_id] = (jobCounts[j.client_id] || 0) + 1 }

    const revenue = {}
    for (const inv of invoices) {
      if (inv.status === 'Paid') revenue[inv.client_id] = (revenue[inv.client_id] || 0) + (inv.amount || 0)
    }

    return clients.map(r => ({
      id: r.id,
      n: r.name,
      e: r.email,
      p: r.phone,
      a: r.address,
      j: jobCounts[r.id] || 0,
      r: revenue[r.id] || 0,
    }))
  } catch (e) { console.error('listClients:', e); return [] }
}

export async function createClient(d) {
  try {
    const { data, error } = await supabase.from('clients').insert({
      name: d.n, email: d.e, phone: d.p, address: d.a,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createClient:', e); return null }
}

export async function updateClient(id, d) {
  try {
    const updates = {}
    if (d.n !== undefined) updates.name = d.n
    if (d.e !== undefined) updates.email = d.e
    if (d.p !== undefined) updates.phone = d.p
    if (d.a !== undefined) updates.address = d.a
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateClient:', e); return null }
}

export async function deleteClient(id) {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteClient:', e); return false }
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function listContacts() {
  try {
    const { data, error } = await supabase.from('contacts').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      n: r.name,
      co: r.company,
      e: r.email,
      p: r.phone,
      ty: r.type,
      tg: r.tags || [],
      nt: r.notes,
    }))
  } catch (e) { console.error('listContacts:', e); return [] }
}

export async function createContact(d) {
  try {
    const tags = typeof d.tg === 'string' ? d.tg.split(',').map(s => s.trim()).filter(Boolean) : (d.tg || [])
    const { data, error } = await supabase.from('contacts').insert({
      name: d.n, company: d.co, email: d.e, phone: d.p,
      type: d.ty, tags, notes: d.nt,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createContact:', e); return null }
}

export async function updateContact(id, d) {
  try {
    const updates = {}
    if (d.n !== undefined) updates.name = d.n
    if (d.co !== undefined) updates.company = d.co
    if (d.e !== undefined) updates.email = d.e
    if (d.p !== undefined) updates.phone = d.p
    if (d.ty !== undefined) updates.type = d.ty
    if (d.tg !== undefined) updates.tags = typeof d.tg === 'string' ? d.tg.split(',').map(s => s.trim()).filter(Boolean) : (d.tg || [])
    if (d.nt !== undefined) updates.notes = d.nt
    const { data, error } = await supabase.from('contacts').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateContact:', e); return null }
}

export async function deleteContact(id) {
  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteContact:', e); return false }
}

// ─── Quotes ─────────────────────────────────────────────────────────────────

export async function listQuotes() {
  try {
    const { data, error } = await supabase.from('quotes').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      clId: r.client_id,
      jobId: r.job_id,
      am: r.amount,
      gst: r.gst,
      st: r.status,
      dt: r.date,
      exp: r.expiry_date,
      v: r.version,
      en: r.external_note,
      inn: r.internal_note,
    }))
  } catch (e) { console.error('listQuotes:', e); return [] }
}

export async function nextQuoteId() {
  try {
    const { data, error } = await supabase.from('site_content').select('invoicing').eq('id', 1).single()
    if (error) throw error
    const counter = data.invoicing.quoteNextNumber || 1
    // Also check max existing quote ID to prevent conflicts
    const { data: quotes } = await supabase.from('quotes').select('id')
    const maxExisting = (quotes || []).reduce((mx, q) => {
      const m = q.id.match(/^Q-(\d+)$/)
      return m ? Math.max(mx, parseInt(m[1], 10)) : mx
    }, 0)
    const n = Math.max(counter, maxExisting + 1)
    const id = `Q-${String(n).padStart(4, '0')}`
    await supabase.from('site_content').update({
      invoicing: { ...data.invoicing, quoteNextNumber: n + 1 },
    }).eq('id', 1)
    return id
  } catch (e) { console.error('nextQuoteId:', e); return null }
}

export async function createQuote(d) {
  try {
    const id = d.id || await nextQuoteId()
    const client_id = d.cl ? await resolveClientId(d.cl) : null
    const job_id = d.job ? await resolveJobId(d.job) : null
    const { data, error } = await supabase.from('quotes').insert({
      id, client_id, job_id, amount: num(d.am), gst: num(d.gst),
      status: d.st, date: d.dt, expiry_date: d.exp || null,
      version: d.v || 1, external_note: d.en || null, internal_note: d.inn || null,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createQuote:', e); return null }
}

export async function updateQuote(id, d) {
  try {
    const updates = {}
    if (d.cl !== undefined) updates.client_id = await resolveClientId(d.cl)
    if (d.job !== undefined) updates.job_id = d.job ? await resolveJobId(d.job) : null
    if (d.am !== undefined) updates.amount = num(d.am)
    if (d.gst !== undefined) updates.gst = num(d.gst)
    if (d.st !== undefined) updates.status = d.st
    if (d.dt !== undefined) updates.date = d.dt
    if (d.exp !== undefined) updates.expiry_date = d.exp || null
    if (d.v !== undefined) updates.version = d.v
    if (d.en !== undefined) updates.external_note = d.en || null
    if (d.inn !== undefined) updates.internal_note = d.inn || null
    const { data, error } = await supabase.from('quotes').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateQuote:', e); return null }
}

export async function deleteQuote(id) {
  try {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteQuote:', e); return false }
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export async function listInvoices() {
  try {
    const { data, error } = await supabase.from('invoices').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      clId: r.client_id,
      am: r.amount,
      gst: r.gst,
      st: r.status,
      dt: r.date,
      due: r.due_date,
      rec: r.recurring_template_id ? 1 : 0,
      en: r.external_note,
      inn: r.internal_note,
      payDt: r.payment_date || null,
      payMethod: r.payment_method || null,
      payRef: r.payment_reference || null,
    }))
  } catch (e) { console.error('listInvoices:', e); return [] }
}

export async function markInvoicesOverdue(ids) {
  if (!ids.length) return
  try {
    const { error } = await supabase.from('invoices')
      .update({ status: 'Overdue' })
      .in('id', ids)
      .eq('status', 'Sent')
    if (error) throw error
  } catch (e) { console.error('markInvoicesOverdue:', e) }
}

export async function nextInvoiceId() {
  try {
    const { data, error } = await supabase.from('site_content').select('invoicing').eq('id', 1).single()
    if (error) throw error
    const prefix = data.invoicing.invoicePrefix || 'SHMAKE'
    const counter = data.invoicing.invoiceNextNumber || 1
    const { data: invoices } = await supabase.from('invoices').select('id')
    const re = new RegExp(`^${prefix}-(\\d+)$`)
    const maxExisting = (invoices || []).reduce((mx, inv) => {
      const m = inv.id.match(re)
      return m ? Math.max(mx, parseInt(m[1], 10)) : mx
    }, 0)
    const n = Math.max(counter, maxExisting + 1)
    const id = `${prefix}-${String(n).padStart(4, '0')}`
    await supabase.from('site_content').update({
      invoicing: { ...data.invoicing, invoiceNextNumber: n + 1 },
    }).eq('id', 1)
    return id
  } catch (e) { console.error('nextInvoiceId:', e); return null }
}

export async function createInvoice(d) {
  try {
    const id = d.id || await nextInvoiceId()
    const client_id = d.cl ? await resolveClientId(d.cl) : null
    const { data, error } = await supabase.from('invoices').insert({
      id, client_id, amount: num(d.am), gst: num(d.gst),
      status: d.st, date: d.dt, due_date: d.due || null,
      recurring_template_id: d.rec || null, linked_quote_id: d.quote || null,
      external_note: d.en || null, internal_note: d.inn || null,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createInvoice:', e); return null }
}

export async function updateInvoice(id, d) {
  try {
    const updates = {}
    if (d.cl !== undefined) updates.client_id = await resolveClientId(d.cl)
    if (d.am !== undefined) updates.amount = num(d.am)
    if (d.gst !== undefined) updates.gst = num(d.gst)
    if (d.st !== undefined) updates.status = d.st
    if (d.dt !== undefined) updates.date = d.dt
    if (d.due !== undefined) updates.due_date = d.due || null
    if (d.en !== undefined) updates.external_note = d.en || null
    if (d.inn !== undefined) updates.internal_note = d.inn || null
    if (d.payDt !== undefined) updates.payment_date = d.payDt || null
    if (d.payMethod !== undefined) updates.payment_method = d.payMethod || null
    if (d.payRef !== undefined) updates.payment_reference = d.payRef || null
    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateInvoice:', e); return null }
}

export async function deleteInvoice(id) {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteInvoice:', e); return false }
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function listExpenses() {
  try {
    const { data, error } = await supabase.from('expenses').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      dt: r.date,
      d: r.description,
      am: r.amount,
      gst: r.gst,
      cat: r.category,
      jobId: r.job_id,
      rcUrl: r.receipt_url || "",
      rc: r.has_receipt ? 1 : 0,
      auto: r.auto_imported ? 1 : 0,
      ap: r.apportioned ? 1 : 0,
      full: r.full_amount,
      bp: r.business_percent,
      sup: r.supplier || "",
      paid: !!r.paid,
      payDt: r.payment_date || null,
      invNo: r.invoice_number || "",
      due: r.due_date || null,
    }))
  } catch (e) { console.error('listExpenses:', e); return [] }
}

export async function createExpense(d) {
  try {
    const job_id = d.job ? await resolveJobId(d.job) : null
    const { data, error } = await supabase.from('expenses').insert({
      date: d.dt, description: d.d, amount: num(d.am), gst: num(d.gst),
      category: d.cat, job_id, supplier: d.sup || null,
      receipt_url: d.rcUrl || null, has_receipt: !!d.rcUrl,
      auto_imported: !!d.auto, apportioned: !!d.ap,
      full_amount: d.ap ? num(d.full) : null, business_percent: d.ap ? (num(d.bp) || null) : null,
      paid: !!d.paid, payment_date: d.payDt || null,
      invoice_number: d.invNo || null, due_date: d.due || null,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createExpense:', e); return null }
}

export async function updateExpense(id, d) {
  try {
    const updates = {}
    if (d.dt !== undefined) updates.date = d.dt
    if (d.d !== undefined) updates.description = d.d
    if (d.am !== undefined) updates.amount = num(d.am)
    if (d.gst !== undefined) updates.gst = num(d.gst)
    if (d.cat !== undefined) updates.category = d.cat
    if (d.job !== undefined) updates.job_id = d.job ? await resolveJobId(d.job) : null
    if (d.sup !== undefined) updates.supplier = d.sup || null
    if (d.rcUrl !== undefined) { updates.receipt_url = d.rcUrl || null; updates.has_receipt = !!d.rcUrl }
    if (d.auto !== undefined) updates.auto_imported = !!d.auto
    if (d.ap !== undefined) updates.apportioned = !!d.ap
    if (d.full !== undefined) updates.full_amount = d.ap ? num(d.full) : null
    if (d.bp !== undefined) updates.business_percent = d.ap ? (num(d.bp) || null) : null
    if (d.paid !== undefined) updates.paid = !!d.paid
    if (d.payDt !== undefined) updates.payment_date = d.payDt || null
    if (d.invNo !== undefined) updates.invoice_number = d.invNo || null
    if (d.due !== undefined) updates.due_date = d.due || null
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateExpense:', e); return null }
}

export async function deleteExpense(id) {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteExpense:', e); return false }
}

// ─── Trips ──────────────────────────────────────────────────────────────────

export async function listTrips() {
  try {
    const { data, error } = await supabase.from('trips').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      dt: r.date,
      fr: r.from_location,
      to: r.to_location,
      km: r.km,
      p: r.purpose,
      cat: r.category,
    }))
  } catch (e) { console.error('listTrips:', e); return [] }
}

export async function createTrip(d) {
  try {
    const { data, error } = await supabase.from('trips').insert({
      date: d.dt, from_location: d.fr, to_location: d.to,
      km: num(d.km), purpose: d.p, category: d.cat,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createTrip:', e); return null }
}

export async function deleteTrip(id) {
  try {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteTrip:', e); return false }
}

// ─── Home Office Expenses ───────────────────────────────────────────────────

export async function listHomeOfficeExpenses() {
  try {
    const { data, error } = await supabase.from('home_office_expenses').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      m: r.month,
      ty: r.type,
      f: r.full_amount,
      pc: r.business_percent,
      d: r.deductible,
    }))
  } catch (e) { console.error('listHomeOfficeExpenses:', e); return [] }
}

export async function createHomeOfficeExpense(d) {
  try {
    const full = num(d.f)
    const pc = num(d.pc)
    const { data, error } = await supabase.from('home_office_expenses').insert({
      month: d.m, type: d.ty, full_amount: full,
      business_percent: pc, deductible: full * pc / 100,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createHomeOfficeExpense:', e); return null }
}

export async function deleteHomeOfficeExpense(id) {
  try {
    const { error } = await supabase.from('home_office_expenses').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteHomeOfficeExpense:', e); return false }
}

// ─── Recurring Templates ────────────────────────────────────────────────────

export async function listRecurringTemplates() {
  try {
    const { data, error } = await supabase.from('recurring_templates').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      clId: r.client_id,
      d: r.description,
      am: r.amount,
      gst: r.gst,
      freq: r.frequency,
      next: r.next_date,
      st: r.status,
      gen: r.generated_count,
    }))
  } catch (e) { console.error('listRecurringTemplates:', e); return [] }
}

export async function createRecurringTemplate(d) {
  try {
    const client_id = d.cl ? await resolveClientId(d.cl) : null
    const { data, error } = await supabase.from('recurring_templates').insert({
      client_id, description: d.d, amount: num(d.am), gst: num(d.gst),
      frequency: d.freq, next_date: d.next || null, status: d.st || 'active',
      generated_count: 0,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createRecurringTemplate:', e); return null }
}

export async function updateRecurringTemplate(id, d) {
  try {
    const updates = {}
    if (d.cl !== undefined) updates.client_id = await resolveClientId(d.cl)
    if (d.d !== undefined) updates.description = d.d
    if (d.am !== undefined) updates.amount = num(d.am)
    if (d.gst !== undefined) updates.gst = num(d.gst)
    if (d.freq !== undefined) updates.frequency = d.freq
    if (d.next !== undefined) updates.next_date = d.next || null
    if (d.st !== undefined) updates.status = d.st
    const { data, error } = await supabase.from('recurring_templates').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateRecurringTemplate:', e); return null }
}

export async function deleteRecurringTemplate(id) {
  try {
    const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteRecurringTemplate:', e); return false }
}

// ─── Subscription Sources ───────────────────────────────────────────────────

export async function listSubscriptionSources() {
  try {
    const { data, error } = await supabase.from('subscription_sources').select('*')
    if (error) throw error
    return (data || []).map(r => {
      const m = r.metadata || {}
      return {
        id: r.id,
        app: r.app_name,
        platform: r.platform || 'Other',
        subscribers: r.subscribers,
        mrr: r.mrr,
        grossJan: r.gross_jan ?? m.grossJan ?? null,
        feesJan: r.fees_jan ?? m.feesJan ?? null,
        netJan: r.net_jan ?? m.netJan ?? null,
        gstJan: r.gst_jan ?? null,
        trend: m.trend ?? [],
        metadata: r.metadata,
        status: r.status ?? 'active',
        stripeSubscriptionId: r.stripe_subscription_id,
        stripeCustomerId: r.stripe_customer_id,
      }
    })
  } catch (e) { console.error('listSubscriptionSources:', e); return [] }
}

export async function createSubscriptionSource(d) {
  try {
    const { data, error } = await supabase.from('subscription_sources').insert({
      app_name: d.appName,
      platform: d.platform || 'Other',
      subscribers: parseInt(d.subscribers) || 1,
      mrr: num(d.mrr),
      gross_jan: num(d.grossJan),
      fees_jan: num(d.feesJan),
      net_jan: num(d.netJan),
      gst_jan: num(d.gstJan),
      metadata: d.metadata || {},
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createSubscriptionSource:', e); return null }
}

export async function updateSubscriptionSource(id, d) {
  try {
    const updates = {}
    if (d.appName !== undefined) updates.app_name = d.appName
    if (d.subscribers !== undefined) updates.subscribers = parseInt(d.subscribers) || 0
    if (d.mrr !== undefined) updates.mrr = num(d.mrr)
    if (d.grossJan !== undefined) updates.gross_jan = num(d.grossJan)
    if (d.feesJan !== undefined) updates.fees_jan = num(d.feesJan)
    if (d.netJan !== undefined) updates.net_jan = num(d.netJan)
    if (d.gstJan !== undefined) updates.gst_jan = num(d.gstJan)
    if (d.metadata !== undefined) updates.metadata = d.metadata
    const { data, error } = await supabase.from('subscription_sources').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateSubscriptionSource:', e); return null }
}

// ─── Manual Payments ─────────────────────────────────────────────────────────

export async function listManualPayments() {
  try {
    const { data, error } = await supabase.from('manual_payments').select('*').order('date', { ascending: false })
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      sid: r.source_id,
      dt: r.date,
      g: Number(r.gross) || 0,
      fe: Number(r.fee) || 0,
      ne: Number(r.net) || 0,
      payer: r.payer,
      n: r.notes,
    }))
  } catch (e) { console.error('listManualPayments:', e); return [] }
}

export async function createManualPayment(d) {
  try {
    const { data, error } = await supabase.from('manual_payments').insert({
      source_id: d.sid,
      date: d.dt,
      gross: num(d.g),
      fee: num(d.fe),
      payer: d.payer || null,
      notes: d.n || null,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createManualPayment:', e); return null }
}

export async function updateManualPayment(id, d) {
  try {
    const updates = {}
    if (d.sid !== undefined) updates.source_id = d.sid
    if (d.dt !== undefined) updates.date = d.dt
    if (d.g !== undefined) updates.gross = num(d.g)
    if (d.fe !== undefined) updates.fee = num(d.fe)
    if (d.payer !== undefined) updates.payer = d.payer
    if (d.n !== undefined) updates.notes = d.n
    const { data, error } = await supabase.from('manual_payments').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateManualPayment:', e); return null }
}

export async function deleteManualPayment(id) {
  try {
    const { error } = await supabase.from('manual_payments').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteManualPayment:', e); return false }
}

export function computeManualPaymentYTD(payments, sourceId) {
  const now = new Date()
  const fyStart = now.getMonth() >= 3
    ? new Date(now.getFullYear(), 3, 1)
    : new Date(now.getFullYear() - 1, 3, 1)
  const filtered = payments.filter(p => {
    if (p.sid !== sourceId) return false
    return new Date(p.dt) >= fyStart
  })
  return {
    ytdGross: filtered.reduce((s, p) => s + (p.g || 0), 0),
    ytdFees: filtered.reduce((s, p) => s + (p.fe || 0), 0),
    ytdNet: filtered.reduce((s, p) => s + (p.ne || 0), 0),
  }
}

// ─── Enquiries ──────────────────────────────────────────────────────────────

export async function listEnquiries() {
  try {
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      msg: r.message,
      status: r.status || "New",
      notes: r.notes || "",
      jobId: r.job_id || null,
      dt: r.created_at,
    }))
  } catch (e) { console.error('listEnquiries:', e); return [] }
}

export async function updateEnquiry(id, d) {
  try {
    const updates = {}
    if (d.status !== undefined) updates.status = d.status
    if (d.notes !== undefined) updates.notes = d.notes || null
    if (d.jobId !== undefined) updates.job_id = d.jobId
    const { data, error } = await supabase.from('enquiries').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateEnquiry:', e); return null }
}

export async function deleteEnquiry(id) {
  try {
    const { error } = await supabase.from('enquiries').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteEnquiry:', e); return false }
}

// ─── Stripe Transactions ────────────────────────────────────────────────────

export async function listStripeTransactions() {
  try {
    const { data, error } = await supabase.from('stripe_transactions').select('*')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      dt: r.date,
      ty: r.type,
      g: Number(r.gross) || 0,
      fe: Number(r.fee) || 0,
      ne: Number(r.net) || 0,
      d: r.description,
    }))
  } catch (e) { console.error('listStripeTransactions:', e); return [] }
}

// ─── Bank Transactions ──────────────────────────────────────────────────────

export async function listBankTransactions() {
  try {
    const { data, error } = await supabase.from('bank_transactions')
      .select('*, bank_matches(id, match_type, invoice_id, expense_id, amount)')
      .order('date', { ascending: false })
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      dt: r.date,
      d: r.description,
      am: Number(r.amount) || 0,
      mt: r.matched_text,
      bank: r.bank_name,
      rec: !!r.reconciled,
      batch: r.import_batch,
      matches: (r.bank_matches || []).map(m => ({
        id: m.id, ty: m.match_type,
        invId: m.invoice_id, expId: m.expense_id,
        am: Number(m.amount) || 0,
      })),
    }))
  } catch (e) { console.error('listBankTransactions:', e); return [] }
}

export async function createBankTransactions(rows) {
  try {
    const { data, error } = await supabase.from('bank_transactions')
      .insert(rows.map(r => ({
        date: r.date, description: r.description,
        amount: num(r.amount), bank_name: r.bank,
        import_batch: r.batch, reconciled: false,
      }))).select()
    if (error) throw error
    return data
  } catch (e) { console.error('createBankTransactions:', e); return null }
}

export async function deleteBankTransaction(id) {
  try {
    const { error } = await supabase.from('bank_transactions').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteBankTransaction:', e); return false }
}

export async function deleteBankBatch(batchId) {
  try {
    const { error } = await supabase.from('bank_transactions').delete().eq('import_batch', batchId)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteBankBatch:', e); return false }
}

export async function createBankMatch(d) {
  try {
    const { data, error } = await supabase.from('bank_matches').insert({
      bank_transaction_id: d.bankTxnId,
      match_type: d.type,
      invoice_id: d.type === 'invoice' ? d.targetId : null,
      expense_id: d.type === 'expense' ? d.targetId : null,
      amount: num(d.amount),
    }).select().single()
    if (error) throw error
    await supabase.from('bank_transactions')
      .update({ reconciled: true }).eq('id', d.bankTxnId)
    if (d.type === 'expense' && d.targetId) {
      await supabase.from('expenses').update({ paid: true, payment_date: d.payDt || null }).eq('id', d.targetId)
    }
    return data
  } catch (e) { console.error('createBankMatch:', e); return null }
}

export async function deleteBankMatch(id, bankTxnId) {
  try {
    // Get match details before deleting (to know if it's an expense)
    const { data: match } = await supabase.from('bank_matches').select('match_type, expense_id').eq('id', id).single()
    const { error } = await supabase.from('bank_matches').delete().eq('id', id)
    if (error) throw error
    const { data: remaining } = await supabase.from('bank_matches')
      .select('id').eq('bank_transaction_id', bankTxnId)
    if (!remaining?.length) {
      await supabase.from('bank_transactions')
        .update({ reconciled: false }).eq('id', bankTxnId)
    }
    // Unmark expense as paid if it was an expense match
    if (match?.match_type === 'expense' && match?.expense_id) {
      const { data: otherMatches } = await supabase.from('bank_matches')
        .select('id').eq('expense_id', match.expense_id)
      if (!otherMatches?.length) {
        await supabase.from('expenses').update({ paid: false, payment_date: null }).eq('id', match.expense_id)
      }
    }
    return true
  } catch (e) { console.error('deleteBankMatch:', e); return false }
}

export function suggestMatches(bankRow, invoices, expenses) {
  const candidates = []
  if (bankRow.am > 0) {
    for (const inv of invoices) {
      if (inv.st === 'Paid' || inv.st === 'Draft') continue
      let score = 0
      if (Math.abs(bankRow.am - inv.am) < 0.01) score += 50
      else if (inv.am > 0 && Math.abs(bankRow.am - inv.am) / inv.am < 0.05) score += 20
      if (bankRow.d && inv.id && bankRow.d.toLowerCase().includes(inv.id.toLowerCase())) score += 40
      if (inv.cl && bankRow.d && bankRow.d.toLowerCase().includes(inv.cl.toLowerCase())) score += 20
      if (inv.due) { const dd = Math.abs((new Date(bankRow.dt) - new Date(inv.due)) / 86400000); if (dd <= 7) score += 10 }
      if (score >= 30) candidates.push({ type: 'invoice', id: inv.id, score, label: `${inv.id} — ${inv.cl || ''}`, amount: inv.am })
    }
  }
  if (bankRow.am < 0) {
    const abs = Math.abs(bankRow.am)
    for (const exp of expenses) {
      if (exp.paid) continue
      let score = 0
      if (Math.abs(abs - exp.am) < 0.01) score += 50
      if (exp.sup && bankRow.d && bankRow.d.toLowerCase().includes(exp.sup.toLowerCase())) score += 25
      if (bankRow.d && exp.d) {
        const bw = new Set(bankRow.d.toLowerCase().split(/\s+/))
        const overlap = exp.d.toLowerCase().split(/\s+/).filter(w => w.length > 2 && bw.has(w)).length
        score += overlap * 10
      }
      if (exp.dt) { const dd = Math.abs((new Date(bankRow.dt) - new Date(exp.dt)) / 86400000); if (dd <= 3) score += 15 }
      if (score >= 30) candidates.push({ type: 'expense', id: exp.id, score, label: exp.d, amount: exp.am })
    }
  }
  candidates.sort((a, b) => b.score - a.score)
  return candidates.slice(0, 5)
}

// ─── Line Items ─────────────────────────────────────────────────────────────

export async function getLineItems(type, parentId) {
  try {
    const table = type === 'quote' ? 'quote_line_items' : 'invoice_line_items'
    const fk = type === 'quote' ? 'quote_id' : 'invoice_id'
    const { data, error } = await supabase.from(table).select('*').eq(fk, parentId)
    if (error) throw error
    return (data || []).map(r => ({
      description: r.description,
      type: r.type,
      quantity: r.quantity,
      unitPrice: r.unit_price,
      total: r.total,
    }))
  } catch (e) { console.error('getLineItems ERROR:', e); return [] }
}

export async function saveLineItems(type, parentId, items) {
  try {
    const table = type === 'quote' ? 'quote_line_items' : 'invoice_line_items'
    const fk = type === 'quote' ? 'quote_id' : 'invoice_id'
    // Delete existing
    const { error: delErr } = await supabase.from(table).delete().eq(fk, parentId)
    if (delErr) throw delErr

    if (!items || items.length === 0) return true

    // Insert new
    const rows = items.map(i => ({
      [fk]: parentId,
      description: i.description,
      type: i.type,
      quantity: num(i.quantity),
      unit_price: num(i.unitPrice),
      total: num(i.total),
    }))
    const { error: insErr } = await supabase.from(table).insert(rows)
    if (insErr) throw insErr
    return true
  } catch (e) { console.error('saveLineItems ERROR:', e); return false }
}

// ─── Compute Functions ──────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function computeRevenue(invoices, subscriptions) {
  try {
    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ y: d.getFullYear(), m: d.getMonth(), label: MONTH_NAMES[d.getMonth()] })
    }

    const totalMrr = (subscriptions || []).reduce((s, sub) => s + (sub.mrr || 0), 0)

    return months.map(({ y, m, label }) => {
      const inv = (invoices || [])
        .filter(i => i.st === 'Paid' && i.dt)
        .filter(i => { const d = new Date(i.dt); return d.getFullYear() === y && d.getMonth() === m })
        .reduce((s, i) => s + (i.am || 0), 0)
      return { m: label, inv, sub: totalMrr }
    })
  } catch (e) { console.error('computeRevenue:', e); return [] }
}

const CATEGORY_COLORS = {
  Materials: '#d97706',
  Tools: '#92400e',
  Software: '#6366f1',
  Vehicle: '#64748b',
  'Home Office': '#059669',
  Processing: '#dc2626',
  Marketing: '#8b5cf6',
  Other: '#78716c',
}

export function computeExpenseCategories(expenses) {
  try {
    const groups = {}
    for (const ex of (expenses || [])) {
      const cat = ex.cat || 'Other'
      groups[cat] = (groups[cat] || 0) + (ex.am || 0)
    }
    return Object.entries(groups).map(([cat, total]) => ({
      n: cat,
      v: total,
      c: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other,
    }))
  } catch (e) { console.error('computeExpenseCategories:', e); return [] }
}

export function computePnl(invoices, expenses, subscriptions) {
  try {
    const now = new Date()
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
    const startMonth = 3 // April (0-indexed)
    const months = []

    for (let i = 0; i <= now.getMonth() + (now.getFullYear() > year ? 12 : 0) - startMonth; i++) {
      const mi = (startMonth + i) % 12
      const yi = startMonth + i >= 12 ? year + 1 : year
      months.push({ y: yi, m: mi, label: MONTH_NAMES[mi] })
    }

    const totalMrr = (subscriptions || []).reduce((s, sub) => s + (sub.mrr || 0), 0)

    return months.map(({ y, m, label }) => {
      const income = (invoices || [])
        .filter(i => i.st === 'Paid' && i.dt)
        .filter(i => { const d = new Date(i.dt); return d.getFullYear() === y && d.getMonth() === m })
        .reduce((s, i) => s + (i.am || 0), 0) + totalMrr

      const exp = (expenses || [])
        .filter(e => e.dt)
        .filter(e => { const d = new Date(e.dt); return d.getFullYear() === y && d.getMonth() === m })
        .reduce((s, e) => s + (e.am || 0), 0)

      return { m: label, i: income, e: exp }
    })
  } catch (e) { console.error('computePnl:', e); return [] }
}

// ─── Site Content ───────────────────────────────────────────────────────────

export async function getSiteContent() {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('id', 1).single()
    if (error) throw error
    return data
  } catch (e) { console.error('getSiteContent:', e); return null }
}

export async function updateSiteContent(section, data) {
  try {
    const { error } = await supabase.from('site_content').update({ [section]: data }).eq('id', 1)
    if (error) throw error
    return true
  } catch (e) { console.error('updateSiteContent:', e); return false }
}

// ─── Portfolio Projects ─────────────────────────────────────────────────────

export async function listPortfolioProjects() {
  try {
    const { data, error } = await supabase.from('portfolio_projects').select('*').order('sort_order')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      description: r.description,
      longDescription: r.long_description,
      gradient: r.gradient,
      year: r.year,
      started: r.started,
      image: r.image,
      gallery: r.gallery,
      specs: r.specs,
      skills: r.skills,
    }))
  } catch (e) { console.error('listPortfolioProjects:', e); return [] }
}

export async function listPortfolioCategories() {
  try {
    const { data, error } = await supabase.from('site_content').select('categories').eq('id', 1).single()
    if (error) throw error
    return {
      categories: data?.categories?.names || ['All'],
      categoryDescriptions: data?.categories?.descriptions || {},
    }
  } catch (e) { console.error('listPortfolioCategories:', e); return { categories: ['All'], categoryDescriptions: {} } }
}

// ─── Portfolio Categories (from portfolio_categories table) ──────────────────

export async function listPortfolioCats() {
  try {
    const { data, error } = await supabase.from('portfolio_categories').select('*').order('sort_order')
    if (error) throw error
    return data || []
  } catch (e) { console.error('listPortfolioCats:', e); return [] }
}

export async function createPortfolioCat(d) {
  try {
    const { data, error } = await supabase.from('portfolio_categories').insert({
      name: d.name, description: d.description || '', sort_order: d.sortOrder || 0,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createPortfolioCat:', e); return null }
}

export async function updatePortfolioCat(id, d) {
  try {
    const updates = {}
    if (d.name !== undefined) updates.name = d.name
    if (d.description !== undefined) updates.description = d.description
    if (d.sortOrder !== undefined) updates.sort_order = d.sortOrder
    const { data, error } = await supabase.from('portfolio_categories').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updatePortfolioCat:', e); return null }
}

export async function deletePortfolioCat(id) {
  try {
    const { error } = await supabase.from('portfolio_categories').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deletePortfolioCat:', e); return false }
}

export async function createPortfolioProject(d) {
  try {
    const category = Array.isArray(d.category) ? d.category : [d.category]
    const { data, error } = await supabase.from('portfolio_projects').insert({
      title: d.title, category, description: d.description,
      long_description: d.longDescription, gradient: d.gradient,
      year: d.year, started: d.started ? parseInt(d.started) : null, image: d.image,
      gallery: d.gallery || [], specs: d.specs || [],
      skills: d.skills || [], sort_order: d.sortOrder || 0,
      featured: d.featured || false,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createPortfolioProject:', e); return null }
}

export async function updatePortfolioProject(id, d) {
  try {
    const updates = {}
    if (d.title !== undefined) updates.title = d.title
    if (d.category !== undefined) updates.category = Array.isArray(d.category) ? d.category : [d.category]
    if (d.description !== undefined) updates.description = d.description
    if (d.longDescription !== undefined) updates.long_description = d.longDescription
    if (d.gradient !== undefined) updates.gradient = d.gradient
    if (d.year !== undefined) updates.year = d.year
    if (d.started !== undefined) updates.started = d.started ? parseInt(d.started) : null
    if (d.image !== undefined) updates.image = d.image
    if (d.gallery !== undefined) updates.gallery = d.gallery
    if (d.specs !== undefined) updates.specs = d.specs
    if (d.skills !== undefined) updates.skills = d.skills
    if (d.sortOrder !== undefined) updates.sort_order = d.sortOrder
    if (d.featured !== undefined) updates.featured = d.featured
    const { data, error } = await supabase.from('portfolio_projects').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updatePortfolioProject:', e); return null }
}

export async function setFeaturedProject(id) {
  try {
    await supabase.from('portfolio_projects').update({ featured: false }).eq('featured', true)
    const { error } = await supabase.from('portfolio_projects').update({ featured: true }).eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('setFeaturedProject:', e); return false }
}

export async function deletePortfolioProject(id) {
  try {
    const { error } = await supabase.from('portfolio_projects').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deletePortfolioProject:', e); return false }
}

// ─── Hero Cards ─────────────────────────────────────────────────────────────

export async function listHeroCards() {
  try {
    const { data, error } = await supabase.from('hero_cards').select('*').order('sort_order')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      key: r.key,
      title: r.title,
      logo: r.logo,
      screenshot: r.screenshot,
      description: r.description,
      linkText: r.link_text,
      linkHref: r.link_href,
      isInternal: r.is_internal,
      initiallyExpanded: r.initially_expanded,
      bgStyle: r.bg_style,
    }))
  } catch (e) { console.error('listHeroCards:', e); return [] }
}

export async function createHeroCard(d) {
  try {
    const { data, error } = await supabase.from('hero_cards').insert({
      key: d.key, title: d.title, logo: d.logo, screenshot: d.screenshot,
      description: d.description, link_text: d.linkText, link_href: d.linkHref,
      is_internal: d.isInternal ?? true, initially_expanded: d.initiallyExpanded ?? false,
      bg_style: d.bgStyle, sort_order: d.sortOrder || 0,
    }).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('createHeroCard:', e); return null }
}

export async function updateHeroCard(id, d) {
  try {
    const updates = {}
    if (d.key !== undefined) updates.key = d.key
    if (d.title !== undefined) updates.title = d.title
    if (d.logo !== undefined) updates.logo = d.logo
    if (d.screenshot !== undefined) updates.screenshot = d.screenshot
    if (d.description !== undefined) updates.description = d.description
    if (d.linkText !== undefined) updates.link_text = d.linkText
    if (d.linkHref !== undefined) updates.link_href = d.linkHref
    if (d.isInternal !== undefined) updates.is_internal = d.isInternal
    if (d.initiallyExpanded !== undefined) updates.initially_expanded = d.initiallyExpanded
    if (d.bgStyle !== undefined) updates.bg_style = d.bgStyle
    if (d.sortOrder !== undefined) updates.sort_order = d.sortOrder
    const { data, error } = await supabase.from('hero_cards').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  } catch (e) { console.error('updateHeroCard:', e); return null }
}

export async function deleteHeroCard(id) {
  try {
    const { error } = await supabase.from('hero_cards').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteHeroCard:', e); return false }
}

// ─── Budget Items ───────────────────────────────────────────────────────

export async function listBudgetItems() {
  try {
    const { data, error } = await supabase.from('budget_items').select('*').order('type').order('category')
    if (error) throw error
    return (data || []).map(r => ({
      id: r.id,
      taxYear: r.tax_year,
      category: r.category,
      type: r.type,
      annualAmount: Number(r.annual_amount) || 0,
      monthlyAmounts: r.monthly_amounts || {},
      notes: r.notes,
    }))
  } catch (e) { console.error('listBudgetItems:', e); return [] }
}

export async function createBudgetItem(d) {
  try {
    const { error } = await supabase.from('budget_items').insert({
      tax_year: d.taxYear,
      category: d.category,
      type: d.type,
      annual_amount: num(d.annualAmount),
      monthly_amounts: d.monthlyAmounts || {},
      notes: d.notes || null,
    })
    if (error) throw error
    return true
  } catch (e) { console.error('createBudgetItem:', e); return false }
}

export async function updateBudgetItem(id, d) {
  try {
    const updates = {}
    if (d.taxYear !== undefined) updates.tax_year = d.taxYear
    if (d.category !== undefined) updates.category = d.category
    if (d.type !== undefined) updates.type = d.type
    if (d.annualAmount !== undefined) updates.annual_amount = num(d.annualAmount)
    if (d.monthlyAmounts !== undefined) updates.monthly_amounts = d.monthlyAmounts
    if (d.notes !== undefined) updates.notes = d.notes || null
    const { error } = await supabase.from('budget_items').update(updates).eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('updateBudgetItem:', e); return false }
}

export async function deleteBudgetItem(id) {
  try {
    const { error } = await supabase.from('budget_items').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (e) { console.error('deleteBudgetItem:', e); return false }
}

/**
 * Compute monthly actuals per budget category for a given tax year.
 * Returns { "Invoicing": [{month:"Apr",value:1200}, ...], "Materials": [...], ... }
 */
export function computeBudgetActuals(invoices, expenses, subscriptions, trips, homeOffice, stripeTransactions, deductions, taxYear) {
  const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
  const startYear = taxYear
  const endYear = taxYear + 1

  // Build month descriptors: {label, m (0-indexed JS month), y (full year)}
  const months = MONTHS.map((label, i) => {
    const m = (i + 3) % 12  // Apr=3, May=4, ..., Dec=11, Jan=0, Feb=1, Mar=2
    const y = i < 9 ? startYear : endYear
    return { label, m, y }
  })

  const inMonth = (dt, mo) => {
    if (!dt) return false
    const d = new Date(dt)
    return d.getFullYear() === mo.y && d.getMonth() === mo.m
  }

  const actuals = {}

  // Income: Invoicing (paid invoices excl GST)
  actuals.Invoicing = months.map(mo => ({
    month: mo.label,
    value: invoices
      .filter(inv => inv.st === 'Paid' && inMonth(inv.dt, mo))
      .reduce((s, inv) => s + (inv.am - (inv.gst || 0)), 0)
  }))

  // Income: Subscriptions (constant MRR per month)
  const mrr = subscriptions.reduce((s, sub) => s + (sub.mrr || 0), 0)
  actuals.Subscriptions = months.map(mo => ({ month: mo.label, value: mrr }))

  // Expense categories from EXP
  const expCats = ['Materials', 'Tools', 'Software', 'Marketing', 'Other']
  for (const cat of expCats) {
    actuals[cat] = months.map(mo => ({
      month: mo.label,
      value: expenses
        .filter(e => e.cat === cat && inMonth(e.dt, mo))
        .reduce((s, e) => s + (e.am || 0), 0)
    }))
  }

  // Vehicle (km × tier1 rate)
  const vRate = deductions?.vehicle?.tier1 || 1.17
  actuals.Vehicle = months.map(mo => ({
    month: mo.label,
    value: trips
      .filter(t => inMonth(t.dt, mo))
      .reduce((s, t) => s + (t.km || 0), 0) * vRate
  }))

  // Home Office (deductible amounts)
  actuals['Home Office'] = months.map(mo => ({
    month: mo.label,
    value: homeOffice.filter(h => {
      if (!h.m) return false
      // h.m is like "Jan 2026" — parse it
      const parts = h.m.split(' ')
      if (parts.length !== 2) return false
      const mNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const mIdx = mNames.indexOf(parts[0])
      const yr = parseInt(parts[1])
      return mIdx === mo.m && yr === mo.y
    }).reduce((s, h) => s + (h.d || 0), 0)
  }))

  // Processing (Stripe charge fees)
  actuals.Processing = months.map(mo => ({
    month: mo.label,
    value: stripeTransactions
      .filter(t => t.ty === 'charge' && inMonth(t.dt, mo))
      .reduce((s, t) => s + (t.fe || 0), 0)
  }))

  return actuals
}
