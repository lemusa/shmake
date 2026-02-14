import { useState, useRef, useEffect } from 'react'
import { loadSiteContent, CONTACT_CONFIG as FALLBACK } from '../data/projects'
import { supabase } from '../lib/supabase'
import SocialLinks from './SocialLinks'

export default function Contact() {
  const [config, setConfig] = useState(FALLBACK)
  useEffect(() => { loadSiteContent().then(sc => setConfig(sc.contact)) }, [])
  const { formAction, recaptchaSiteKey, heading, subheading } = config
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

    // Save to Supabase immediately (before Formspree, fire-and-forget)
    supabase.from('enquiries').insert({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      message: formData.get('message'),
    }).then(({ error }) => { if (error) console.error('Enquiry save:', error) })

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
    <section className="text-center px-4 md:px-8 py-16 max-w-[1000px] mx-auto scroll-section" id="contact">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">{heading}</h2>
        <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>{subheading}</p>

        <form
          ref={formRef}
          className="max-w-[500px] mx-auto mb-12 text-left"
          action={formAction}
          method="POST"
          onSubmit={handleSubmit}
        >
          <div className="mb-6">
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Name</label>
            <input type="text" name="name" required className="form-input" />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Email</label>
            <input type="email" name="email" required className="form-input" />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Phone (optional)</label>
            <input type="tel" name="phone" className="form-input" />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium" style={{ color: 'var(--text)' }}>Message</label>
            <textarea name="message" required className="form-input min-h-[120px] resize-y" />
          </div>

          <div className="mb-6">
            <div className="g-recaptcha" data-sitekey={recaptchaSiteKey} data-theme="light" />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-accent text-white rounded-lg font-semibold text-base cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Send Message
          </button>

          {status && (
            <div className={`form-status-msg ${status}`}>
              {statusMsg}
            </div>
          )}
        </form>

        <div className="w-[100px] h-px mx-auto my-8" style={{ background: 'var(--border)' }} />

        <SocialLinks />
      </div>
    </section>
  )
}
