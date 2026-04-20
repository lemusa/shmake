import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { loadSiteContent, CONTACT_CONFIG as FALLBACK, ABOUT_CONTENT as ABOUT_FALLBACK } from '../data/projects'
import { supabase } from '../lib/supabase'
import SocialLinks from './SocialLinks'

export default function Contact() {
  const [config, setConfig] = useState(FALLBACK)
  const [wontDo, setWontDo] = useState(ABOUT_FALLBACK.wontDo || [])
  useEffect(() => {
    loadSiteContent().then(sc => {
      setConfig(sc.contact)
      const about = { ...ABOUT_FALLBACK, ...(sc.about || {}) }
      setWontDo(about.wontDo || [])
    })
  }, [])
  const { formAction, recaptchaSiteKey, eyebrow = 'Get in touch', heading, subheading } = config
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [statusMsg, setStatusMsg] = useState('')
  const formRef = useRef(null)

  // Load reCAPTCHA script
  useEffect(() => {
    if (!document.querySelector('script[src*="recaptcha"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check reCAPTCHA
    const recaptchaResponse = window.grecaptcha?.getResponse()
    if (!recaptchaResponse) {
      setStatus('error')
      setStatusMsg('Please complete the reCAPTCHA verification.')
      return
    }

    const formData = new FormData(formRef.current)
    formData.append('g-recaptcha-response', recaptchaResponse)

    // Save to Supabase (before Formspree, fire-and-forget)
    const enqPayload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      message: formData.get('message'),
    }
    supabase.from('enquiries').insert(enqPayload)
      .then(({ error }) => { if (error) console.error('Enquiry save failed:', error.message, error.code, error.details) })

    try {
      const response = await fetch(formAction, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        setStatus('success')
        setStatusMsg("Thanks for your message! I'll get back to you soon.")
        formRef.current.reset()
        window.grecaptcha?.reset()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Form submission failed')
      }
    } catch (error) {
      console.error('Form error:', error)
      setStatus('error')
      setStatusMsg('Oops! There was a problem sending your message. Please try again.')
    }
  }

  return (
    <section className="scroll-section contact-page" id="contact">
      <div className="contact-page-inner">
        <div className="contact-page-header">
          <div className="split-eyebrow">
            <span className="split-eyebrow-line" />
            <span className="split-eyebrow-text">{eyebrow}</span>
          </div>
          <h2 className="contact-page-headline">{heading}</h2>
          <p className="contact-page-sub">{subheading}</p>
        </div>

        <div className="contact-page-grid">
          <form
            ref={formRef}
            className="contact-form text-left"
            action={formAction}
            method="POST"
            onSubmit={handleSubmit}
          >
            <div className="contact-field">
              <label className="contact-label">Name</label>
              <input type="text" name="name" required className="form-input" placeholder="Jane Smith" />
            </div>

            <div className="contact-field">
              <label className="contact-label">Email</label>
              <input type="email" name="email" required className="form-input" placeholder="jane@acmemfg.co.nz" />
            </div>

            <div className="contact-field">
              <label className="contact-label">
                Phone <span className="contact-label-hint">(optional)</span>
              </label>
              <input type="tel" name="phone" className="form-input" placeholder="+64 21 000 000" />
            </div>

            <div className="contact-field">
              <label className="contact-label">What's the problem?</label>
              <textarea
                name="message"
                required
                className="form-input contact-textarea"
                placeholder="Describe what's broken, slow, or driving you mad. The more specific the better."
              />
            </div>

            <div className="contact-field">
              <div className="g-recaptcha" data-sitekey={recaptchaSiteKey} data-theme="light" />
            </div>

            <button type="submit" className="contact-submit">
              Send message →
            </button>

            {status && (
              <div className={`form-status-msg ${status}`}>
                {statusMsg}
              </div>
            )}
          </form>

          {wontDo.length > 0 && (
            <div className="contact-aside-col">
              <aside className="contact-wont" aria-label="What I won't do">
                <div className="split-eyebrow">
                  <span className="split-eyebrow-line" />
                  <span className="split-eyebrow-text">What I won't do</span>
                </div>
                <h3 className="contact-wont-headline">Before you hit send.</h3>
                <p className="contact-wont-intro">A few things I'll never do to you.</p>
                <ul className="contact-wont-list">
                  {wontDo.map((item, i) => (
                    <li key={i} className="contact-wont-item">
                      <span className="contact-wont-x" aria-hidden="true">
                        <X size={14} strokeWidth={2.75} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="contact-wont-signoff">
                  You talk to me. I build it, I know it, I fix it.
                </p>
              </aside>

              <div className="contact-direct">
                <span className="contact-direct-label">Or reach me directly</span>
                <SocialLinks variant="pill" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="contact-page-footer">
        <p>© {new Date().getFullYear()} Sam Haughey. All rights reserved.</p>
      </div>
    </section>
  )
}
