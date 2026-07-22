(() => {
  const form = document.querySelector('[data-project-inquiry]');
  if (!form) return;

  const status = form.querySelector('[data-inquiry-status]');
  const result = form.querySelector('[data-inquiry-result]');
  const resultTitle = form.querySelector('[data-result-title]');
  const resultText = form.querySelector('[data-result-text]');
  const mailLink = form.querySelector('[data-result-mail]');
  const whatsappLink = form.querySelector('[data-result-whatsapp]');
  const copyButton = form.querySelector('[data-result-copy]');
  const submitButton = form.querySelector('[type="submit"]');
  const fallbackEmail = 'info@tomorrowworks-agentur.de';
  const whatsappNumber = '4915227706694';

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.className = `inquiry-status${type ? ` is-${type}` : ''}`;
  };

  const readInquiry = () => {
    const data = new FormData(form);
    const reference = `TW-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`;
    const fields = {
      reference,
      project: String(data.get('projektart') || '').trim(),
      name: String(data.get('name') || '').trim(),
      company: String(data.get('firma') || '').trim(),
      email: String(data.get('email') || '').trim(),
      phone: String(data.get('telefon') || '').trim(),
      message: String(data.get('nachricht') || '').trim()
    };
    const subject = `TOMORROWWORKS Erstgespräch · ${fields.project} · ${fields.reference}`;
    const text = [
      'Guten Tag,',
      '',
      'ich möchte ein kostenloses 20-Minuten-Erstgespräch anfragen.',
      '',
      `Projekt: ${fields.project}`,
      `Name: ${fields.name}`,
      `Firma: ${fields.company || '–'}`,
      `E-Mail: ${fields.email}`,
      `Telefon: ${fields.phone || '–'}`,
      '',
      'Mein Vorhaben:',
      fields.message,
      '',
      `Referenz: ${fields.reference}`
    ].join('\n');
    return { fields, subject, text };
  };

  const showFallback = inquiry => {
    mailLink.href = `mailto:${fallbackEmail}?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(inquiry.text)}`;
    whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(inquiry.text)}`;
    resultTitle.textContent = 'Ihre Anfrage ist vorbereitet.';
    resultText.textContent = 'Ein direkter Serverversand ist derzeit nicht aktiviert. Wählen Sie E-Mail oder WhatsApp – erst dort wird die Anfrage tatsächlich gesendet.';
    result.classList.add('is-visible');
    setStatus('Noch nicht versendet. Bitte einen der angezeigten Kontaktwege wählen.');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const submitToEndpoint = async (endpoint, inquiry) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(inquiry.fields)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    resultTitle.textContent = 'Ihre Anfrage wurde übertragen.';
    resultText.textContent = `Referenz ${inquiry.fields.reference}. Wir melden uns persönlich bei Ihnen.`;
    result.classList.add('is-visible');
    setStatus('Erfolgreich übermittelt.', 'success');
    form.reset();
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    result.classList.remove('is-visible');
    setStatus('');
    if (!form.reportValidity()) return;
    if (form.elements.website?.value) return;

    const inquiry = readInquiry();
    const endpoint = (form.dataset.endpoint || '').trim();
    if (!endpoint) {
      showFallback(inquiry);
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    setStatus('Anfrage wird sicher übertragen …');
    try {
      await submitToEndpoint(endpoint, inquiry);
    } catch (error) {
      showFallback(inquiry);
      setStatus('Die direkte Übertragung war nicht möglich. Ihre Eingaben bleiben erhalten; nutzen Sie bitte E-Mail oder WhatsApp.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute('aria-busy');
    }
  });

  copyButton?.addEventListener('click', async () => {
    const inquiry = readInquiry();
    try {
      await navigator.clipboard.writeText(inquiry.text);
      setStatus('Anfragetext kopiert. Sie können ihn jetzt in Ihren bevorzugten Kontaktweg einfügen.', 'success');
    } catch (error) {
      setStatus('Kopieren wurde vom Browser blockiert. Bitte E-Mail oder WhatsApp verwenden.', 'error');
    }
  });
})();
