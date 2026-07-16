(() => {
  'use strict';

  const form = document.getElementById('card-config-form');
  if (!form) return;

  const byId = id => document.getElementById(id);
  const fields = {
    company: byId('company'),
    cardName: byId('card-name'),
    role: byId('role'),
    phone: byId('phone'),
    cardEmail: byId('card-email'),
    website: byId('website'),
    address: byId('address'),
    orientation: byId('orientation'),
    accentColor: byId('accent-color'),
    accentHex: byId('accent-hex'),
    safeArea: byId('safe-area'),
    quantity: byId('quantity'),
    paper: byId('paper'),
    sides: byId('sides'),
    finish: byId('finish'),
    corners: byId('corners'),
    delivery: byId('delivery'),
    requestDate: byId('request-date'),
    notes: byId('notes'),
    contactEmail: byId('contact-email'),
    privacy: byId('privacy-check'),
    rights: byId('rights-check'),
    logo: byId('logo-upload'),
    templateFile: byId('template-file-upload')
  };

  const preview = {
    card: byId('business-card'),
    companyFront: byId('preview-company-front'),
    companyBack: byId('preview-company-back'),
    name: byId('preview-name'),
    role: byId('preview-role'),
    phone: byId('preview-phone'),
    email: byId('preview-email'),
    website: byId('preview-website'),
    address: byId('preview-address'),
    initials: byId('preview-initials'),
    logoMark: byId('preview-logo-mark'),
    logoImage: byId('preview-logo-image'),
    front: byId('card-front'),
    back: byId('card-back'),
    customFront: byId('custom-template-front'),
    customFrontImage: byId('custom-template-front-image'),
    customFrontTitle: byId('custom-template-front-title'),
    customFrontNote: byId('custom-template-front-note'),
    customBack: byId('custom-template-back'),
    customBackImage: byId('custom-template-back-image'),
    customBackTitle: byId('custom-template-back-title'),
    customBackNote: byId('custom-template-back-note')
  };

  const summary = {
    template: byId('summary-template'),
    format: byId('summary-format'),
    quantity: byId('summary-quantity'),
    paper: byId('summary-paper'),
    sides: byId('summary-sides'),
    finish: byId('summary-finish'),
    corners: byId('summary-corners'),
    delivery: byId('summary-delivery'),
    totalPrice: byId('summary-total-price'),
    priceBreakdown: byId('price-breakdown'),
    priceEstimate: byId('price-estimate')
  };

  const fileStatus = byId('file-status');
  const templateUploadPanel = byId('template-upload-panel');
  const templateDetection = byId('template-detection');
  const templateDetectionText = byId('template-detection-text');
  const sidesAutoHint = byId('sides-auto-hint');
  const attachmentReminder = byId('attachment-reminder');
  const attachmentFileList = byId('attachment-file-list');
  const formError = byId('form-error');
  const formStatus = byId('form-status');
  const submitButton = byId('submit-inquiry');
  const downloadButton = byId('download-preview');
  const sideTabs = Array.from(document.querySelectorAll('.side-tab'));
  const templateInputs = Array.from(document.querySelectorAll('input[name="template"]'));
  const workflowInputs = Array.from(document.querySelectorAll('input[name="workflow-mode"]'));
  const uploadWorkflow = byId('upload-workflow');
  const templateWorkflow = byId('template-workflow');
  const preflightList = byId('preflight-list');
  const wizardSteps = Array.from(document.querySelectorAll('.wizard-step'));
  const progressButtons = Array.from(document.querySelectorAll('.progress-item[data-step-target]'));
  const wizardBack = byId('wizard-back');
  const wizardNext = byId('wizard-next');
  const wizardTotalPrice = byId('wizard-total-price');
  const copyInquiryButton = byId('copy-inquiry');
  const previewJump = byId('show-preview-mobile');
  let wizardStep = 1;
  let maxStepReached = 1;
  let activeSide = 'front';
  let logoDataUrl = '';
  let logoFileName = '';
  let standardSidesValue = fields.sides.value;
  let pdfJsPromise = null;
  const PDFJS_BASE = 'assets/vendor/pdfjs/5.4.624/';
  const customSource = {
    input: fields.templateFile,
    status: byId('template-file-status'),
    fileName: '',
    kind: '',
    pageCount: 0,
    processing: false,
    revision: 0,
    loadingTask: null,
    preflight: [],
    formatLabel: ''
  };
  const customFiles = {
    front: {
      layer: preview.customFront,
      image: preview.customFrontImage,
      title: preview.customFrontTitle,
      note: preview.customFrontNote,
      fileName: '',
      kind: '',
      objectUrl: '',
      statusNote: ''
    },
    back: {
      layer: preview.customBack,
      image: preview.customBackImage,
      title: preview.customBackTitle,
      note: preview.customBackNote,
      fileName: '',
      kind: '',
      objectUrl: '',
      statusNote: ''
    }
  };

  const fallback = (value, replacement) => value.trim() || replacement;
  const selectedText = select => select.options[select.selectedIndex].text;
  const workflowValue = () => workflowInputs.find(input => input.checked)?.value || '';
  const templateValue = () => workflowValue() === 'upload' ? 'eigen' : templateInputs.find(input => input.checked)?.value || 'klar';
  const templateLabels = { klar: 'Klar', dunkel: 'Dunkel', akzent: 'Akzent', eigen: 'Eigene Datei' };
  const hasUploadedAsset = () => Boolean((workflowValue() === 'template' && logoDataUrl) || (workflowValue() === 'upload' && customSource.fileName));
  const PRICE_VERSION = '2026-07-13';
  const PRICE_TABLE = {
    production: { 100: 3090, 250: 3290, 500: 3590, 1000: 4090 },
    template: { klar: 2990, dunkel: 2990, akzent: 2990, eigen: 0 },
    sides: {
      single: { 100: 0, 250: 0, 500: 0, 1000: 0 },
      double: { 100: 290, 250: 390, 500: 490, 1000: 690 }
    },
    paper: {
      matte: { 100: 0, 250: 0, 500: 0, 1000: 0 },
      recycling: { 100: 490, 250: 590, 500: 790, 1000: 1090 },
      premium: { 100: 790, 250: 990, 500: 1390, 1000: 1890 }
    },
    finish: {
      none: { 100: 0, 250: 0, 500: 0, 1000: 0 },
      'matte-lamination': { 100: 990, 250: 1190, 500: 1590, 1000: 2290 },
      'soft-touch': { 100: 1390, 250: 1690, 500: 2290, 1000: 3290 }
    },
    corners: {
      classic: { 100: 0, 250: 0, 500: 0, 1000: 0 },
      rounded: { 100: 890, 250: 990, 500: 1190, 1000: 1590 }
    },
    delivery: { pickup: 0, shipping: 590 }
  };
  const priceFormatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

  const initialsFor = company => {
    const words = company.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'TW';
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  const normalizeHex = value => {
    const candidate = value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(candidate)) return `#${candidate.toLowerCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(candidate)) return `#${candidate.split('').map(char => char + char).join('').toLowerCase()}`;
    return null;
  };

  const contrastingInk = hex => {
    const normalized = normalizeHex(hex) || '#ff641a';
    const rgb = [1, 3, 5].map(index => parseInt(normalized.slice(index, index + 2), 16) / 255);
    const linear = rgb.map(value => value <= .03928 ? value / 12.92 : Math.pow((value + .055) / 1.055, 2.4));
    const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
    return luminance > .42 ? '#111315' : '#ffffff';
  };

  const setPreviewText = (element, value, replacement) => {
    if (element) element.textContent = fallback(value, replacement);
  };

  const setFileStatus = (element, message, type = '') => {
    element.textContent = message;
    element.className = `file-status${element.classList.contains('template-file-status') ? ' template-file-status' : ''}${type ? ` ${type}` : ''}`;
  };

  const setControlsDisabled = (container, disabled) => {
    if (!container) return;
    container.querySelectorAll('input, select, textarea, button').forEach(control => {
      control.disabled = disabled;
    });
  };

  const updateRightsRequirement = () => {
    fields.rights.required = hasUploadedAsset();
    if (!hasUploadedAsset() || fields.rights.checked) fields.rights.setCustomValidity('');
  };

  const updateAttachmentReminder = () => {
    const ownTemplate = workflowValue() === 'upload';
    const files = [
      logoFileName ? `Logo: ${logoFileName}` : '',
      ownTemplate && customSource.fileName ? `Druckdatei: ${customSource.fileName}` : ''
    ].filter(Boolean);
    attachmentReminder.hidden = files.length === 0;
    attachmentFileList.textContent = files.join(' · ');
  };

  const updateCustomLayer = side => {
    const asset = customFiles[side];
    const isFront = side === 'front';
    asset.layer.classList.toggle('has-image', asset.kind === 'image' && Boolean(asset.objectUrl));
    if (asset.kind === 'image' && asset.objectUrl) {
      asset.image.src = asset.objectUrl;
      asset.image.alt = `${isFront ? 'Vorderseite' : 'Rückseite'} aus ${asset.fileName}`;
      asset.title.textContent = asset.fileName;
      asset.note.textContent = asset.statusNote || 'Bildvorschau · persönliche Druckprüfung folgt';
    } else {
      asset.image.removeAttribute('src');
      asset.image.alt = '';
      asset.title.textContent = asset.fileName || (isFront ? 'Eigene Vorlage hochladen' : 'Eigene Rückseite hochladen');
      asset.note.textContent = isFront ? 'PNG, JPG, WebP oder PDF' : 'Rückseite wird aus Seite 2 erkannt';
    }
  };

  const updateDownloadAction = () => {
    if (templateValue() !== 'eigen') {
      downloadButton.disabled = false;
      downloadButton.textContent = 'Vorschau herunterladen';
      return;
    }
    const asset = customFiles[activeSide];
    const available = asset.kind === 'image' && Boolean(asset.objectUrl);
    downloadButton.disabled = !available;
    downloadButton.textContent = available
      ? 'Vorschau herunterladen'
      : activeSide === 'front' ? 'Druckdatei zuerst hochladen' : 'Keine Rückseite erkannt';
  };

  const updateTemplateMode = () => {
    const mode = workflowValue();
    const ownTemplate = mode === 'upload';
    form.dataset.mode = mode;
    if (uploadWorkflow) uploadWorkflow.hidden = !ownTemplate;
    if (templateWorkflow) templateWorkflow.hidden = mode !== 'template';
    setControlsDisabled(uploadWorkflow, !ownTemplate);
    setControlsDisabled(templateWorkflow, mode !== 'template');
    fields.templateFile.required = ownTemplate;
    fields.sides.disabled = ownTemplate;
    fields.orientation.disabled = mode !== 'template';
    fields.safeArea.disabled = mode !== 'template';
    sidesAutoHint.hidden = !ownTemplate;
    if (ownTemplate) {
      fields.sides.value = customSource.pageCount === 2 ? 'double' : 'single';
    } else {
      fields.sides.value = standardSidesValue;
    }
    fields.company.required = mode === 'template';
    fields.cardName.required = mode === 'template';
    fields.company.setAttribute('aria-required', String(mode === 'template'));
    fields.cardName.setAttribute('aria-required', String(mode === 'template'));
    if (!ownTemplate || customSource.fileName) fields.templateFile.setCustomValidity('');
    const backDisabled = ownTemplate && customSource.pageCount < 2;
    const backTab = sideTabs.find(tab => tab.dataset.side === 'back');
    if (backTab) {
      backTab.disabled = backDisabled;
      backTab.setAttribute('aria-disabled', String(backDisabled));
    }
    if (backDisabled && activeSide === 'back') {
      const returnFocus = document.activeElement === backTab;
      setSide('front');
      if (returnFocus) sideTabs.find(tab => tab.dataset.side === 'front')?.focus();
    }
    updateCustomLayer('front');
    updateCustomLayer('back');
    updateDownloadAction();
  };

  const formatPrice = cents => priceFormatter.format(cents / 100);

  const calculatePrice = () => {
    const quantity = fields.quantity.value;
    const template = templateValue();
    const values = {
      production: PRICE_TABLE.production[quantity],
      template: PRICE_TABLE.template[template],
      sides: PRICE_TABLE.sides[fields.sides.value]?.[quantity],
      paper: PRICE_TABLE.paper[fields.paper.value]?.[quantity],
      finish: PRICE_TABLE.finish[fields.finish.value]?.[quantity],
      corners: PRICE_TABLE.corners[fields.corners.value]?.[quantity],
      delivery: PRICE_TABLE.delivery[fields.delivery.value]
    };
    if (!Object.values(values).every(value => Number.isInteger(value) && value >= 0)) {
      return { valid: false, total: null, items: [] };
    }

    const items = [
      { label: `Druck & Abwicklung · ${quantity} Stück`, cents: values.production },
      template === 'eigen'
        ? { label: 'Eigene Datei · Basis-Datencheck', cents: 0, included: true }
        : { label: 'Vorlagenservice · 1 Korrekturabzug', cents: values.template }
    ];
    if (values.sides) items.push({ label: 'Beidseitiger Druck', cents: values.sides });
    if (values.paper) items.push({ label: selectedText(fields.paper), cents: values.paper });
    if (values.finish) items.push({ label: selectedText(fields.finish), cents: values.finish });
    if (values.corners) items.push({ label: 'Abgerundete Ecken', cents: values.corners });
    if (fields.delivery.value === 'shipping') {
      items.push({ label: 'Versand · Deutschland Festland', cents: values.delivery });
    } else {
      items.push({ label: 'Abholung in Mosbach', cents: 0, included: true });
    }

    return {
      valid: true,
      total: Object.values(values).reduce((sum, value) => sum + value, 0),
      items
    };
  };

  const updatePrice = () => {
    if (!workflowValue()) {
      summary.priceBreakdown.replaceChildren();
      summary.priceEstimate.classList.add('unavailable');
      summary.totalPrice.textContent = 'Weg wählen';
      wizardTotalPrice.textContent = 'Weg wählen';
      return;
    }
    const calculation = calculatePrice();
    summary.priceBreakdown.replaceChildren();
    summary.priceEstimate.classList.toggle('unavailable', !calculation.valid);
    if (!calculation.valid) {
      summary.totalPrice.textContent = 'Preis wird geprüft';
      wizardTotalPrice.textContent = 'Preis wird geprüft';
      return;
    }
    const priceText = workflowValue() === 'upload' && !customSource.pageCount
      ? `ab ${formatPrice(calculation.total)}`
      : formatPrice(calculation.total);
    summary.totalPrice.textContent = priceText;
    wizardTotalPrice.textContent = priceText;
    calculation.items.forEach(item => {
      const row = document.createElement('div');
      const label = document.createElement('span');
      const price = document.createElement('strong');
      label.textContent = item.label;
      price.textContent = item.included ? 'inklusive' : formatPrice(item.cents);
      row.append(label, price);
      summary.priceBreakdown.append(row);
    });
  };

  const updateSummary = () => {
    const mode = workflowValue();
    summary.template.textContent = mode === 'upload' ? 'Eigene Druckdatei' : mode === 'template' ? templateLabels[templateValue()] : 'Noch nicht gewählt';
    summary.format.textContent = mode === 'upload' && customSource.formatLabel
      ? customSource.formatLabel
      : fields.orientation.value === 'portrait' ? '55 × 85 mm' : '85 × 55 mm';
    summary.quantity.textContent = `${fields.quantity.value} Stück`;
    summary.paper.textContent = selectedText(fields.paper);
    summary.sides.textContent = selectedText(fields.sides);
    summary.finish.textContent = selectedText(fields.finish);
    summary.corners.textContent = selectedText(fields.corners);
    summary.delivery.textContent = selectedText(fields.delivery);
    updatePrice();
  };

  const updatePreview = () => {
    const company = fallback(fields.company.value, 'Musterwerk GmbH');
    const accent = normalizeHex(fields.accentHex.value) || fields.accentColor.value || '#ff641a';
    const template = templateValue();
    updateTemplateMode();
    preview.card.className = `business-card template-${template}${fields.orientation.value === 'portrait' ? ' portrait' : ''}${fields.safeArea.checked ? ' show-safe' : ''}`;
    preview.card.style.setProperty('--card-accent', accent);
    preview.card.style.setProperty('--accent-ink', contrastingInk(accent));
    fields.accentColor.value = accent;
    if (document.activeElement !== fields.accentHex) fields.accentHex.value = accent;

    setPreviewText(preview.companyFront, company, 'Musterwerk GmbH');
    setPreviewText(preview.companyBack, company, 'Musterwerk GmbH');
    setPreviewText(preview.name, fields.cardName.value, 'Anna Beispiel');
    setPreviewText(preview.role, fields.role.value, 'Geschäftsführung');
    setPreviewText(preview.phone, fields.phone.value, '+49 6261 000000');
    setPreviewText(preview.email, fields.cardEmail.value, 'hallo@musterwerk.de');
    setPreviewText(preview.website, fields.website.value, 'www.musterwerk.de');
    setPreviewText(preview.address, fields.address.value, 'Musterstraße 1 · 74821 Mosbach');
    preview.initials.textContent = initialsFor(company);
    updateRightsRequirement();
    updateAttachmentReminder();
    updateSummary();
  };

  const setSide = side => {
    const requestedTab = sideTabs.find(tab => tab.dataset.side === side);
    if (side === 'back' && requestedTab?.disabled) return;
    activeSide = side === 'back' ? 'back' : 'front';
    preview.front.classList.toggle('active', activeSide === 'front');
    preview.back.classList.toggle('active', activeSide === 'back');
    preview.front.hidden = activeSide !== 'front';
    preview.back.hidden = activeSide !== 'back';
    preview.front.setAttribute('aria-hidden', String(activeSide !== 'front'));
    preview.back.setAttribute('aria-hidden', String(activeSide !== 'back'));
    sideTabs.forEach(tab => {
      const active = tab.dataset.side === activeSide;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    updateDownloadAction();
  };

  const showFileStatus = (message, type = '') => {
    setFileStatus(fileStatus, message, type);
  };

  const clearLogo = () => {
    logoDataUrl = '';
    logoFileName = '';
    preview.logoImage.removeAttribute('src');
    preview.logoMark.classList.remove('has-image');
    updateRightsRequirement();
    updateAttachmentReminder();
    showFileStatus('Noch kein Logo gewählt');
  };

  const releasePreviewAsset = asset => {
    if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    asset.objectUrl = '';
    asset.fileName = '';
    asset.kind = '';
    asset.statusNote = '';
    asset.image.removeAttribute('src');
    asset.layer.classList.remove('has-image');
  };

  const releasePreviewAssets = () => Object.values(customFiles).forEach(releasePreviewAsset);

  const cancelPdfTask = () => {
    if (!customSource.loadingTask) return;
    const task = customSource.loadingTask;
    customSource.loadingTask = null;
    Promise.resolve(task.destroy()).catch(() => {});
  };

  const setTemplateProcessing = processing => {
    customSource.processing = processing;
    fields.templateFile.setAttribute('aria-busy', String(processing));
    submitButton.disabled = processing;
    wizardNext.disabled = processing;
  };

  const clearCustomTemplate = (message = 'Noch keine Druckdatei gewählt', type = '', clearInput = true) => {
    customSource.revision += 1;
    cancelPdfTask();
    releasePreviewAssets();
    customSource.fileName = '';
    customSource.kind = '';
    customSource.pageCount = 0;
    customSource.preflight = [];
    customSource.formatLabel = '';
    if (clearInput) fields.templateFile.value = '';
    fields.templateFile.setCustomValidity('');
    templateDetection.hidden = true;
    templateDetectionText.textContent = '';
    preflightList.replaceChildren();
    setFileStatus(customSource.status, message, type);
    setTemplateProcessing(false);
    if (templateValue() === 'eigen') fields.sides.value = 'single';
    setSide('front');
    updatePreview();
  };

  const fileKind = file => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (file.type === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || ['png', 'jpg', 'jpeg', 'webp'].includes(extension)) return 'image';
    return '';
  };

  const hasRasterSignature = async file => {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const png = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
    const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const webp = bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    return png || jpeg || webp;
  };

  const selectOwnTemplate = () => {
    const uploadInput = workflowInputs.find(input => input.value === 'upload');
    if (uploadInput) uploadInput.checked = true;
    fields.sides.value = customSource.pageCount === 2 ? 'double' : 'single';
  };

  const roundMillimeters = value => Math.round(value * 10) / 10;
  const millimetersFromPoints = points => points * 25.4 / 72;
  const closeTo = (value, target, tolerance = .65) => Math.abs(value - target) <= tolerance;

  const classifyPrintedSize = (width, height) => {
    const long = Math.max(width, height);
    const short = Math.min(width, height);
    const label = `${roundMillimeters(width).toLocaleString('de-DE')} × ${roundMillimeters(height).toLocaleString('de-DE')} mm`;
    if (closeTo(long, 89) && closeTo(short, 59)) {
      return { status: 'good', label, detail: 'Seitenformat enthält 2 mm Beschnitt rund um 85 × 55 mm.', bleed: true };
    }
    if (closeTo(long, 85) && closeTo(short, 55)) {
      return { status: 'warn', label, detail: 'Endformat 85 × 55 mm erkannt; zusätzlicher Beschnitt fehlt.', bleed: false };
    }
    return { status: 'warn', label, detail: 'Format weicht vom Endformat 85 × 55 mm beziehungsweise Beschnittformat 89 × 59 mm ab.', bleed: false };
  };

  const renderPreflight = (checks, summaryText, formatLabel) => {
    customSource.preflight = checks;
    customSource.formatLabel = formatLabel || '';
    preflightList.replaceChildren();
    checks.forEach(check => {
      const item = document.createElement('li');
      item.className = check.status || '';
      const text = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = `${check.label}: `;
      text.append(title, check.detail);
      item.append(text);
      preflightList.append(item);
    });
    templateDetectionText.textContent = summaryText;
    templateDetection.hidden = false;
  };

  const loadPdfJs = async () => {
    if (!pdfJsPromise) {
      const moduleUrl = new URL(`${PDFJS_BASE}pdf.min.mjs`, document.baseURI).href;
      const workerUrl = new URL(`${PDFJS_BASE}pdf.worker.min.mjs`, document.baseURI).href;
      pdfJsPromise = import(moduleUrl).then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        return pdfjsLib;
      }).catch(error => {
        pdfJsPromise = null;
        throw error;
      });
    }
    return pdfJsPromise;
  };

  const canvasToPngBlob = canvas => new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('canvas-export-failed')), 'image/png');
  });

  const renderPdfPage = async (pdfDocument, pageNumber) => {
    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = 1500 / Math.max(baseViewport.width, baseViewport.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, background: '#ffffff' }).promise;
    const blob = await canvasToPngBlob(canvas);
    page.cleanup();
    return {
      objectUrl: URL.createObjectURL(blob),
      width: baseViewport.width,
      height: baseViewport.height
    };
  };

  const isCurrentCustomFile = (file, revision) => customSource.revision === revision && fields.templateFile.files?.[0] === file;

  const setPreviewAsset = (side, objectUrl, fileName, statusNote) => {
    const asset = customFiles[side];
    releasePreviewAsset(asset);
    asset.objectUrl = objectUrl;
    asset.fileName = fileName;
    asset.kind = 'image';
    asset.statusNote = statusNote;
  };

  const finishCustomTemplate = ({ file, kind, pageCount, orientation, status, statusType = 'good', detection, checks = [], formatLabel = '' }) => {
    customSource.fileName = file.name;
    customSource.kind = kind;
    customSource.pageCount = pageCount;
    fields.orientation.value = orientation;
    fields.sides.value = pageCount === 2 ? 'double' : 'single';
    fields.templateFile.setCustomValidity('');
    renderPreflight(checks, detection, formatLabel);
    setFileStatus(customSource.status, status, statusType);
    setTemplateProcessing(false);
    setSide('front');
    updatePreview();
  };

  const handleCustomTemplateFile = async () => {
    const file = fields.templateFile.files?.[0];
    if (!file) {
      clearCustomTemplate();
      return;
    }

    const kind = fileKind(file);
    if (!kind) {
      clearCustomTemplate('Bitte PNG, JPG, WebP oder PDF verwenden', 'warn');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      clearCustomTemplate('Datei ist größer als 15 MB', 'warn');
      return;
    }

    const revision = customSource.revision + 1;
    customSource.revision = revision;
    cancelPdfTask();
    releasePreviewAssets();
    customSource.fileName = '';
    customSource.kind = '';
    customSource.pageCount = 0;
    customSource.preflight = [];
    customSource.formatLabel = '';
    selectOwnTemplate();
    templateDetection.hidden = true;
    templateDetectionText.textContent = '';
    preflightList.replaceChildren();
    fields.templateFile.setCustomValidity('Die Druckdatei wird noch geprüft.');
    setTemplateProcessing(true);
    setFileStatus(customSource.status, 'Datei wird lokal geprüft …');
    setSide('front');
    updatePreview();

    if (kind === 'image') {
      let objectUrl = '';
      try {
        if (!await hasRasterSignature(file)) throw new Error('invalid-image-signature');
        if (!isCurrentCustomFile(file, revision)) return;
        objectUrl = URL.createObjectURL(file);
        const testImage = new Image();
        testImage.src = objectUrl;
        await testImage.decode();
        if (!isCurrentCustomFile(file, revision)) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        const pixelCount = testImage.naturalWidth * testImage.naturalHeight;
        if (pixelCount > 50_000_000) throw new Error('image-too-large');
        const longEdge = Math.max(testImage.naturalWidth, testImage.naturalHeight);
        const shortEdge = Math.min(testImage.naturalWidth, testImage.naturalHeight);
        const imageRatio = longEdge / shortEdge;
        const bleedRatio = 89 / 59;
        const trimRatio = 85 / 55;
        const usesBleedRatio = Math.abs(imageRatio - bleedRatio) <= Math.abs(imageRatio - trimRatio);
        const targetLongMm = usesBleedRatio ? 89 : 85;
        const targetShortMm = usesBleedRatio ? 59 : 55;
        const effectiveDpi = Math.round(Math.min(longEdge / (targetLongMm / 25.4), shortEdge / (targetShortMm / 25.4)));
        const ratioDifference = Math.min(Math.abs(imageRatio - bleedRatio) / bleedRatio, Math.abs(imageRatio - trimRatio) / trimRatio);
        const ratioStatus = ratioDifference <= .025 ? 'good' : 'warn';
        const dpiStatus = effectiveDpi >= 300 ? 'good' : 'warn';
        const lowResolution = effectiveDpi < 300;
        const hasRasterWarning = lowResolution || ratioStatus === 'warn';
        const formatLabel = `${testImage.naturalWidth} × ${testImage.naturalHeight} px`;
        const checks = [
          { status: 'good', label: 'Seiten', detail: '1 Seite erkannt · Vorderseite · einseitiger Druck.' },
          { status: ratioStatus, label: 'Format', detail: ratioStatus === 'good' ? `Seitenverhältnis passt zum ${usesBleedRatio ? 'Beschnittformat 89 × 59 mm' : 'Endformat 85 × 55 mm'}.` : 'Seitenverhältnis weicht vom üblichen Visitenkartenformat ab.' },
          { status: dpiStatus, label: 'Auflösung', detail: `etwa ${effectiveDpi} dpi bei ${targetLongMm} × ${targetShortMm} mm${effectiveDpi >= 300 ? ' · passend für den Druck.' : ' · bitte persönlich prüfen lassen.'}` },
          { status: 'info', label: 'Beschnitt', detail: usesBleedRatio ? 'Dateiverhältnis passt zum Beschnittformat; der tatsächliche Randinhalt wird persönlich geprüft.' : 'Im Endformat ist kein zusätzlicher Beschnittrand erkennbar.' }
        ];
        setPreviewAsset('front', objectUrl, file.name, 'Vorderseite aus Ihrer Druckdatei');
        objectUrl = '';
        finishCustomTemplate({
          file,
          kind,
          pageCount: 1,
          orientation: testImage.naturalWidth >= testImage.naturalHeight ? 'landscape' : 'portrait',
          status: hasRasterWarning ? '1 Seite erkannt · Basisprüfung mit Hinweis' : '1 Seite erkannt · Basisprüfung abgeschlossen',
          statusType: hasRasterWarning ? 'warn' : 'good',
          detection: `1 Seite · ${formatLabel}`,
          checks,
          formatLabel
        });
      } catch (error) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (isCurrentCustomFile(file, revision)) clearCustomTemplate(error?.message === 'image-too-large' ? 'Bild ist für die Browserprüfung zu groß' : 'Bilddatei konnte nicht gelesen werden', 'error');
      }
      return;
    }

    let pdfDocument = null;
    let loadingTask = null;
    const renderedPages = [];
    try {
      const signatureBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      const signature = Array.from(signatureBytes, byte => String.fromCharCode(byte)).join('');
      if (signature !== '%PDF-') throw new Error('invalid-pdf');
      if (!isCurrentCustomFile(file, revision)) return;
      const pdfjsLib = await loadPdfJs();
      if (!isCurrentCustomFile(file, revision)) return;
      const data = new Uint8Array(await file.arrayBuffer());
      if (!isCurrentCustomFile(file, revision)) return;
      loadingTask = pdfjsLib.getDocument({ data });
      customSource.loadingTask = loadingTask;
      pdfDocument = await loadingTask.promise;
      if (!isCurrentCustomFile(file, revision)) {
        await pdfDocument.destroy();
        if (customSource.loadingTask === loadingTask) customSource.loadingTask = null;
        return;
      }
      if (pdfDocument.numPages < 1 || pdfDocument.numPages > 2) throw new Error('unsupported-page-count');

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const rendered = await renderPdfPage(pdfDocument, pageNumber);
        renderedPages.push(rendered);
        if (!isCurrentCustomFile(file, revision)) {
          renderedPages.forEach(page => URL.revokeObjectURL(page.objectUrl));
          await pdfDocument.destroy();
          return;
        }
      }

      const pageCount = pdfDocument.numPages;
      await pdfDocument.destroy();
      pdfDocument = null;
      if (customSource.loadingTask === loadingTask) customSource.loadingTask = null;
      if (!isCurrentCustomFile(file, revision)) {
        renderedPages.forEach(page => URL.revokeObjectURL(page.objectUrl));
        return;
      }
      setPreviewAsset('front', renderedPages[0].objectUrl, `${file.name} · Seite 1`, 'Seite 1 · Vorderseite');
      if (pageCount === 2) setPreviewAsset('back', renderedPages[1].objectUrl, `${file.name} · Seite 2`, 'Seite 2 · Rückseite');
      const pageSizes = renderedPages.map(page => ({ width: millimetersFromPoints(page.width), height: millimetersFromPoints(page.height) }));
      const firstSize = classifyPrintedSize(pageSizes[0].width, pageSizes[0].height);
      const sameFormat = pageCount === 1 || (
        Math.abs(pageSizes[0].width - pageSizes[1].width) <= .5
        && Math.abs(pageSizes[0].height - pageSizes[1].height) <= .5
      );
      const checks = [
        { status: 'good', label: 'Seiten', detail: pageCount === 2 ? '2 Seiten · Seite 1 vorne, Seite 2 hinten.' : '1 Seite · Vorderseite · einseitiger Druck.' },
        { status: firstSize.status, label: 'Format', detail: `${firstSize.label} · ${firstSize.detail}` },
        ...(pageCount === 2 ? [{ status: sameFormat ? 'good' : 'warn', label: 'Seitengleichheit', detail: sameFormat ? 'Vorder- und Rückseite haben das gleiche Seitenformat.' : 'Vorder- und Rückseite haben unterschiedliche Abmessungen.' }] : []),
        { status: 'info', label: 'PDF-Inhalte', detail: 'Bildauflösung, Farbraum, Schriften und Transparenzen werden persönlich geprüft.' }
      ];
      const hasWarning = checks.some(check => check.status === 'warn' || check.status === 'error');
      finishCustomTemplate({
        file,
        kind,
        pageCount,
        orientation: renderedPages[0].width >= renderedPages[0].height ? 'landscape' : 'portrait',
        status: pageCount === 2 ? '2 PDF-Seiten erkannt · Basisprüfung abgeschlossen' : '1 PDF-Seite erkannt · Basisprüfung abgeschlossen',
        statusType: hasWarning ? 'warn' : 'good',
        detection: `${pageCount} ${pageCount === 1 ? 'Seite' : 'Seiten'} · ${firstSize.label}`,
        checks,
        formatLabel: firstSize.label
      });
    } catch (error) {
      if (pdfDocument) await pdfDocument.destroy().catch(() => {});
      if (customSource.loadingTask === loadingTask) customSource.loadingTask = null;
      renderedPages.forEach(page => URL.revokeObjectURL(page.objectUrl));
      if (!isCurrentCustomFile(file, revision)) return;
      const message = error?.name === 'PasswordException'
        ? 'Passwortgeschützte PDFs werden nicht unterstützt'
        : error?.message === 'unsupported-page-count'
          ? 'Bitte eine PDF mit genau einer oder zwei Seiten verwenden'
          : error?.message === 'invalid-pdf'
            ? 'Keine gültige PDF-Datei'
            : 'PDF konnte nicht gelesen oder dargestellt werden';
      clearCustomTemplate(message, 'error');
    }
  };

  fields.templateFile.addEventListener('change', handleCustomTemplateFile);

  fields.logo.addEventListener('change', () => {
    const file = fields.logo.files?.[0];
    if (!file) {
      clearLogo();
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      fields.logo.value = '';
      clearLogo();
      showFileStatus('Bitte PNG, JPG oder WebP verwenden', 'warn');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      fields.logo.value = '';
      clearLogo();
      showFileStatus('Logo ist größer als 5 MB', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', event => {
      logoDataUrl = String(event.target?.result || '');
      logoFileName = file.name;
      const testImage = new Image();
      testImage.addEventListener('load', () => {
        preview.logoImage.src = logoDataUrl;
        preview.logoMark.classList.add('has-image');
        updateRightsRequirement();
        updateAttachmentReminder();
        const small = testImage.naturalWidth < 300 || testImage.naturalHeight < 150;
        showFileStatus(small ? 'Logo geladen · Auflösung bitte prüfen' : 'Logo lokal geladen', small ? 'warn' : 'good');
      });
      testImage.addEventListener('error', () => {
        fields.logo.value = '';
        clearLogo();
        showFileStatus('Bilddatei konnte nicht gelesen werden', 'warn');
      });
      testImage.src = logoDataUrl;
    });
    reader.addEventListener('error', () => {
      fields.logo.value = '';
      clearLogo();
      showFileStatus('Logo konnte nicht gelesen werden', 'warn');
    });
    reader.readAsDataURL(file);
  });

  fields.accentColor.addEventListener('input', () => {
    fields.accentHex.value = fields.accentColor.value.toLowerCase();
    updatePreview();
  });

  fields.accentHex.addEventListener('input', () => {
    const normalized = normalizeHex(fields.accentHex.value);
    fields.accentHex.setCustomValidity(normalized ? '' : 'Bitte eine gültige Hex-Farbe eingeben, zum Beispiel #ff641a.');
    if (normalized) {
      fields.accentColor.value = normalized;
      updatePreview();
    }
  });

  const localDateValue = date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  fields.requestDate.min = localDateValue(new Date());

  const validateRequestDate = () => {
    fields.requestDate.setCustomValidity(fields.requestDate.value && fields.requestDate.value < fields.requestDate.min
      ? 'Bitte wählen Sie heute oder einen späteren Wunschtermin.'
      : '');
  };

  const setWizardStep = (requestedStep, { focus = false, scroll = false } = {}) => {
    const target = Math.max(1, Math.min(3, requestedStep));
    if (target > maxStepReached) return;
    wizardStep = target;
    wizardSteps.forEach(step => {
      const active = Number(step.dataset.step) === target;
      step.hidden = !active;
      step.classList.toggle('is-active', active);
    });
    progressButtons.forEach(button => {
      const stepNumber = Number(button.dataset.stepTarget);
      const active = stepNumber === target;
      const completed = stepNumber < target;
      button.classList.toggle('active', active);
      button.classList.toggle('completed', completed);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.disabled = stepNumber > maxStepReached;
      button.setAttribute('aria-disabled', String(stepNumber > maxStepReached));
    });
    wizardBack.hidden = target === 1;
    wizardNext.hidden = target === 3;
    submitButton.hidden = target !== 3;
    formStatus.textContent = target === 1
      ? 'Wählen Sie zuerst, ob Sie eine fertige Datei hochladen oder eine Vorlage gestalten möchten.'
      : target === 2
        ? workflowValue() === 'upload'
          ? 'Laden Sie genau eine Druckdatei für Vorder- und Rückseite hoch.'
          : 'Tragen Sie die Kartendaten ein und wählen Sie eine Gestaltung.'
        : 'Prüfen Sie Druckoptionen und Kontaktangaben. Danach wird Ihre unverbindliche Anfrage vorbereitet.';
    if (focus) {
      const activeStep = wizardSteps.find(step => Number(step.dataset.step) === target);
      activeStep?.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)')?.focus({ preventScroll: true });
    }
    if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const setStepFileValidity = () => {
    const uploadMode = workflowValue() === 'upload';
    fields.templateFile.setCustomValidity(uploadMode && customSource.processing
      ? 'Bitte warten Sie, bis die Druckdatei vollständig geprüft wurde.'
      : uploadMode && !customSource.fileName
        ? 'Bitte laden Sie eine ein- oder zweiseitige Druckdatei hoch.'
        : '');
  };

  const controlsForStep = stepNumber => {
    const step = wizardSteps.find(candidate => Number(candidate.dataset.step) === stepNumber);
    return step ? Array.from(step.querySelectorAll('input, select, textarea')).filter(control => !control.disabled) : [];
  };

  const validateStep = stepNumber => {
    setStepFileValidity();
    validateRequestDate();
    const invalid = controlsForStep(stepNumber).find(control => !control.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    formError.textContent = stepNumber === 1
      ? 'Bitte wählen Sie einen der beiden Wege.'
      : 'Bitte prüfen Sie die markierten Pflichtfelder in diesem Schritt.';
    formError.classList.add('visible');
    return false;
  };

  const advanceWizard = () => {
    if (!validateStep(wizardStep)) return;
    maxStepReached = Math.max(maxStepReached, Math.min(3, wizardStep + 1));
    setWizardStep(wizardStep + 1, { focus: true, scroll: true });
    formError.classList.remove('visible');
  };

  workflowInputs.forEach(input => input.addEventListener('change', () => {
    maxStepReached = Math.max(maxStepReached, 2);
    updateTemplateMode();
    updatePreview();
    formStatus.textContent = input.value === 'upload'
      ? 'Im nächsten Schritt laden Sie genau eine Druckdatei für Vorder- und Rückseite hoch.'
      : 'Im nächsten Schritt tragen Sie die Kartendaten ein und wählen eine Gestaltung.';
  }));

  wizardNext.addEventListener('click', advanceWizard);
  wizardBack.addEventListener('click', () => setWizardStep(wizardStep - 1, { focus: true, scroll: true }));
  progressButtons.forEach(button => button.addEventListener('click', () => {
    const target = Number(button.dataset.stepTarget);
    if (target > maxStepReached || (target > wizardStep && !validateStep(wizardStep))) return;
    setWizardStep(target, { focus: true, scroll: true });
  }));

  form.addEventListener('input', event => {
    if (![fields.logo, fields.templateFile, fields.accentHex].includes(event.target)) updatePreview();
    formError.classList.remove('visible');
  });
  form.addEventListener('change', event => {
    if (event.target === fields.requestDate) validateRequestDate();
    updatePreview();
  });
  fields.sides.addEventListener('change', () => {
    if (templateValue() !== 'eigen') standardSidesValue = fields.sides.value;
  });
  templateInputs.forEach(input => input.addEventListener('change', updatePreview));
  sideTabs.forEach(tab => tab.addEventListener('click', () => setSide(tab.dataset.side)));
  sideTabs.forEach(tab => tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const enabledTabs = sideTabs.filter(candidate => !candidate.disabled);
    const currentIndex = enabledTabs.indexOf(tab);
    const targetIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabledTabs.length - 1
        : event.key === 'ArrowRight'
          ? (currentIndex + 1) % enabledTabs.length
          : (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    const targetTab = enabledTabs[targetIndex];
    setSide(targetTab.dataset.side);
    targetTab.focus();
  }));

  const fitText = (context, value, maxWidth, startSize, weight = 700) => {
    let size = startSize;
    const text = value || '';
    while (size > 22) {
      context.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
      if (context.measureText(text).width <= maxWidth) return { text, size };
      size -= 2;
    }
    context.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
    let shortened = text;
    while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1);
    return { text: `${shortened}…`, size };
  };

  const drawLogo = async (context, x, y, width, height, accent, ink, company) => {
    if (logoDataUrl) {
      const image = new Image();
      image.src = logoDataUrl;
      try {
        await image.decode();
        const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        context.fillStyle = '#ffffff';
        context.fillRect(x, y, width, height);
        context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
        return;
      } catch (_) {
        // Falls das lokale Bild nicht dekodiert werden kann, werden Initialen gezeichnet.
      }
    }
    context.fillStyle = accent;
    context.beginPath();
    context.roundRect(x, y, height, height, 18);
    context.fill();
    context.fillStyle = ink;
    context.font = '800 28px "Segoe UI", Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initialsFor(company), x + height / 2, y + height / 2 + 1);
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
  };

  const drawCustomTemplatePage = async (context, asset, width, height, side) => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    if (asset.kind === 'image' && asset.objectUrl) {
      const image = new Image();
      image.src = asset.objectUrl;
      try {
        await image.decode();
        const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
        return;
      } catch (_) {
        // Bei einem unerwarteten Dekodierfehler bleibt die sichere Prüfplatzhalter-Ansicht erhalten.
      }
    }

    context.fillStyle = '#f3f1eb';
    context.fillRect(0, 0, width, height);
    const iconSize = Math.round(Math.min(width, height) * .13);
    context.fillStyle = '#ff641a';
    context.beginPath();
    context.roundRect((width - iconSize) / 2, height * .25, iconSize, iconSize, iconSize * .25);
    context.fill();
    context.fillStyle = '#111315';
    context.textAlign = 'center';
    context.font = `800 ${Math.round(iconSize * .34)}px "Segoe UI", Arial, sans-serif`;
    context.fillText(asset.kind === 'pdf' ? 'PDF' : '↑', width / 2, height * .25 + iconSize * .63);
    const title = asset.fileName || `Eigene ${side === 'front' ? 'Vorderseite' : 'Rückseite'}`;
    const fitted = fitText(context, title, width * .78, Math.round(Math.min(width, height) * .065), 800);
    context.font = `800 ${fitted.size}px "Segoe UI", Arial, sans-serif`;
    context.fillText(fitted.text, width / 2, height * .57);
    context.fillStyle = '#666b6e';
    context.font = `500 ${Math.round(Math.min(width, height) * .032)}px "Segoe UI", Arial, sans-serif`;
    context.fillText(asset.kind === 'pdf' ? 'PDF wird persönlich auf Druckfähigkeit geprüft' : 'Vorlagendatei noch nicht geladen', width / 2, height * .66);
    context.textAlign = 'left';
  };

  const downloadPreview = async () => {
    if (templateValue() === 'eigen') {
      const asset = customFiles[activeSide];
      if (asset.kind !== 'image' || !asset.objectUrl) {
        formStatus.textContent = 'Bitte laden Sie zuerst eine gültige Druckdatei hoch und warten Sie auf die Seitenvorschau.';
        return;
      }
    }
    const portrait = fields.orientation.value === 'portrait';
    const width = portrait ? 650 : 1004;
    const height = portrait ? 1004 : 650;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const template = templateValue();
    const accent = normalizeHex(fields.accentHex.value) || '#ff641a';
    const accentInk = contrastingInk(accent);
    const background = template === 'dunkel' ? '#101316' : template === 'akzent' ? accent : '#f3efe6';
    const foreground = template === 'dunkel' ? '#ffffff' : template === 'akzent' ? accentInk : '#111315';
    const muted = template === 'dunkel' ? '#aeb4ba' : template === 'akzent' ? accentInk : '#666b6e';
    const detailAccent = template === 'akzent' ? accentInk : accent;
    const marginX = Math.round(width * .087);
    const marginY = Math.round(height * .1);
    const company = fallback(fields.company.value, 'Musterwerk GmbH');

    if (template === 'eigen') {
      await drawCustomTemplatePage(context, customFiles[activeSide], width, height, activeSide);
    } else {
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
      context.fillStyle = foreground;
      context.textBaseline = 'alphabetic';
      await drawLogo(context, marginX, marginY, Math.round(width * .2), Math.round(height * .11), detailAccent, template === 'akzent' ? accent : '#111315', company);

      const companyText = fitText(context, company, width * .55, portrait ? 40 : 46, 800);
      context.font = `800 ${companyText.size}px "Segoe UI", Arial, sans-serif`;
      context.fillStyle = foreground;
      context.fillText(companyText.text, marginX + Math.round(height * .13), marginY + Math.round(height * .08));

      if (activeSide === 'front') {
        const name = fallback(fields.cardName.value, 'Anna Beispiel');
        const fittedName = fitText(context, name, width - marginX * 2, portrait ? 50 : 62, 750);
        context.font = `750 ${fittedName.size}px "Segoe UI", Arial, sans-serif`;
        context.fillStyle = foreground;
        context.fillText(fittedName.text, marginX, height * .72);
        context.font = `${portrait ? 24 : 27}px "Segoe UI", Arial, sans-serif`;
        context.fillStyle = muted;
        context.fillText(fallback(fields.role.value, 'Geschäftsführung'), marginX, height * .79, width - marginX * 2);
        context.fillStyle = detailAccent;
        context.beginPath();
        context.roundRect(marginX, height * .88, width - marginX * 2, Math.max(8, height * .025), 10);
        context.fill();
      } else {
        const details = [
          fallback(fields.phone.value, '+49 6261 000000'),
          fallback(fields.cardEmail.value, 'hallo@musterwerk.de'),
          fallback(fields.website.value, 'www.musterwerk.de'),
          fallback(fields.address.value, 'Musterstraße 1 · 74821 Mosbach')
        ];
        context.font = `${portrait ? 22 : 25}px "Segoe UI", Arial, sans-serif`;
        details.forEach((value, index) => {
          const y = height * (.56 + index * .075);
          context.fillStyle = detailAccent;
          context.beginPath();
          context.arc(marginX + 6, y - 7, 6, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = foreground;
          context.fillText(value, marginX + 28, y, width - marginX * 2 - 28);
        });
      }
    }

    context.save();
    context.globalAlpha = .88;
    context.fillStyle = '#111315';
    const watermarkWidth = portrait ? width * .76 : width * .43;
    context.beginPath();
    context.roundRect(width - watermarkWidth - 18, 18, watermarkWidth, 44, 22);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '800 17px "Segoe UI", Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText('VORSCHAU · NICHT DRUCKVERBINDLICH', width - watermarkWidth / 2 - 18, 47);
    context.restore();

    canvas.toBlob(blob => {
      if (!blob) return;
      const link = document.createElement('a');
      const safeCompany = company.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, '-').replace(/^-|-$/g, '') || 'visitenkarte';
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${safeCompany}-${activeSide === 'front' ? 'vorderseite' : 'rueckseite'}-vorschau.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      formStatus.textContent = 'Die aktuelle Vorschauseite wurde heruntergeladen.';
    }, 'image/png');
  };

  downloadButton.addEventListener('click', downloadPreview);
  previewJump.addEventListener('click', () => byId('card-preview').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  byId('go-inquiry').addEventListener('click', () => {
    if (!workflowValue()) {
      setWizardStep(1, { focus: true, scroll: true });
      formStatus.textContent = 'Wählen Sie zuerst Ihren Weg zur Visitenkarte.';
      return;
    }
    setStepFileValidity();
    const stepTwoReady = controlsForStep(2).every(control => control.checkValidity());
    maxStepReached = Math.max(maxStepReached, stepTwoReady ? 3 : 2);
    setWizardStep(stepTwoReady ? 3 : 2, { focus: true, scroll: true });
    if (!stepTwoReady) formStatus.textContent = 'Bitte vervollständigen Sie zunächst die Gestaltung beziehungsweise Druckdatei.';
  });

  const buildInquiry = () => {
    const ownTemplate = workflowValue() === 'upload';
    const company = fallback(fields.company.value, ownTemplate ? 'in Druckdatei enthalten' : 'ohne Firmenangabe');
    const filesToAttach = [
      !ownTemplate && logoFileName ? logoFileName : '',
      ownTemplate ? customSource.fileName : ''
    ].filter(Boolean);
    const priceCalculation = calculatePrice();
    const priceMailLines = priceCalculation.valid
      ? [
          '',
          `Voraussichtlicher Gesamtpreis: ${formatPrice(priceCalculation.total)} inkl. 19 % MwSt.`,
          ...priceCalculation.items.map(item => `  - ${item.label}: ${item.included ? 'inklusive' : formatPrice(item.cents)}`),
          `Preisstand: ${PRICE_VERSION} · unverbindliche Preisschätzung`,
          ''
        ]
      : ['', 'Voraussichtlicher Gesamtpreis: wird nach Prüfung ermittelt', ''];
    const preflightLines = ownTemplate && customSource.preflight.length
      ? ['', 'Lokale Basisprüfung:', ...customSource.preflight.map(check => `  - ${check.label}: ${check.detail}`)]
      : [];
    const lines = [
      'Guten Tag,',
      '',
      'ich möchte die folgende Visitenkarten-Konfiguration unverbindlich prüfen und anbieten lassen:',
      '',
      `Weg: ${ownTemplate ? 'fertige Druckdatei' : 'Gestaltung mit Vorlage'}`,
      `Firma: ${company}`,
      `Name auf der Karte: ${fields.cardName.value || (ownTemplate ? 'in eigener Druckdatei enthalten' : '—')}`,
      `Position: ${fields.role.value || '—'}`,
      `Telefon auf der Karte: ${fields.phone.value || '—'}`,
      `E-Mail auf der Karte: ${fields.cardEmail.value || '—'}`,
      `Website: ${fields.website.value || '—'}`,
      `Adresse: ${fields.address.value || '—'}`,
      `Vorlage: ${ownTemplate ? 'eigene Druckdatei' : templateLabels[templateValue()] || templateValue()}`,
      `Format: ${ownTemplate && customSource.formatLabel ? customSource.formatLabel : fields.orientation.value === 'portrait' ? '55 × 85 mm (hoch)' : '85 × 55 mm (quer)'}`,
      ...(!ownTemplate ? [`Akzentfarbe: ${normalizeHex(fields.accentHex.value) || fields.accentColor.value}`] : []),
      `Auflage: ${fields.quantity.value} Stück`,
      `Papier: ${selectedText(fields.paper)}`,
      `Seiten: ${selectedText(fields.sides)}`,
      `Veredelung: ${selectedText(fields.finish)}`,
      `Ecken: ${selectedText(fields.corners)}`,
      `Übergabe: ${selectedText(fields.delivery)}`,
      `Wunschtermin: ${fields.requestDate.value || 'offen'}`,
      ...priceMailLines,
      ...preflightLines,
      `Logo gewählt: ${!ownTemplate && logoFileName ? `Ja (${logoFileName})` : 'Nein'}`,
      `Eigene Druckdatei: ${ownTemplate ? customSource.fileName || 'fehlt' : 'nicht ausgewählt'}`,
      `Erkannte Seiten: ${ownTemplate ? customSource.pageCount || 'nicht erkannt' : 'nicht zutreffend'}`,
      `Zuordnung: ${ownTemplate ? (customSource.pageCount === 2 ? 'Seite 1 = Vorderseite · Seite 2 = Rückseite' : 'Seite 1 = Vorderseite · einseitig') : 'nicht zutreffend'}`,
      ...(filesToAttach.length ? [`WICHTIG – diese Originaldateien gehören zur Anfrage: ${filesToAttach.join(', ')}`] : []),
      `Kontakt-E-Mail: ${fields.contactEmail.value}`,
      `Anmerkungen: ${fields.notes.value || '—'}`,
      '',
      'Mir ist bekannt, dass diese Anfrage noch keine Bestellung ist. Ich bitte um Prüfung, Angebot und Korrekturabzug.',
      '',
      'Freundliche Grüße'
    ];
    return {
      ownTemplate,
      company,
      filesToAttach,
      priceCalculation,
      subject: `Visitenkarten-Anfrage · ${company}`,
      text: lines.join('\n'),
      config: {
        mode: workflowValue(),
        template: templateValue(),
        company,
        cardName: fields.cardName.value,
        role: fields.role.value,
        phone: fields.phone.value,
        cardEmail: fields.cardEmail.value,
        website: fields.website.value,
        address: fields.address.value,
        format: ownTemplate && customSource.formatLabel ? customSource.formatLabel : selectedText(fields.orientation),
        quantity: fields.quantity.value,
        paper: fields.paper.value,
        sides: fields.sides.value,
        finish: fields.finish.value,
        corners: fields.corners.value,
        delivery: fields.delivery.value,
        requestDate: fields.requestDate.value,
        contactEmail: fields.contactEmail.value,
        notes: fields.notes.value,
        preflight: customSource.preflight,
        estimatedPriceCents: priceCalculation.valid ? priceCalculation.total : null,
        priceVersion: PRICE_VERSION
      }
    };
  };

  const copyInquiryText = async () => {
    const inquiry = buildInquiry();
    try {
      await navigator.clipboard.writeText(inquiry.text);
      formStatus.textContent = 'Der vollständige Anfragetext wurde kopiert.';
    } catch (_) {
      const helper = document.createElement('textarea');
      helper.value = inquiry.text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.append(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      formStatus.textContent = copied ? 'Der vollständige Anfragetext wurde kopiert.' : 'Der Anfragetext konnte nicht automatisch kopiert werden.';
    }
  };
  copyInquiryButton.addEventListener('click', copyInquiryText);

  const submitToConfiguredEndpoint = async inquiry => {
    const endpoint = form.dataset.submitEndpoint?.trim();
    if (!endpoint) return null;
    const body = new FormData();
    body.append('configuration', JSON.stringify(inquiry.config));
    const logoFile = workflowValue() === 'template' ? fields.logo.files?.[0] : null;
    const templateFile = workflowValue() === 'upload' ? fields.templateFile.files?.[0] : null;
    if (logoFile) body.append('logo', logoFile, logoFile.name);
    if (templateFile) body.append('printFile', templateFile, templateFile.name);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'X-Requested-With': 'TOMORROWWORKS-Configurator' },
      body
    });
    if (!response.ok) throw new Error(`submission-failed-${response.status}`);
    return response.json();
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    formError.classList.remove('visible');
    setStepFileValidity();
    validateRequestDate();
    fields.rights.setCustomValidity(hasUploadedAsset() && !fields.rights.checked ? 'Bitte bestätigen Sie die Nutzungsrechte an Logo und Vorlagendateien.' : '');
    const invalidEntry = [1, 2, 3].map(stepNumber => ({
      stepNumber,
      control: controlsForStep(stepNumber).find(control => !control.checkValidity())
    })).find(entry => entry.control);
    if (invalidEntry) {
      maxStepReached = Math.max(maxStepReached, invalidEntry.stepNumber);
      setWizardStep(invalidEntry.stepNumber, { scroll: true });
      requestAnimationFrame(() => invalidEntry.control.reportValidity());
      formError.textContent = 'Bitte prüfen Sie die markierten Pflichtfelder und Bestätigungen.';
      formError.classList.add('visible');
      return;
    }

    const inquiry = buildInquiry();
    submitButton.disabled = true;
    formStatus.textContent = 'Die Anfrage wird vorbereitet …';
    try {
      const onlineResult = await submitToConfiguredEndpoint(inquiry);
      if (onlineResult) {
        const reference = onlineResult.reference || onlineResult.id || '';
        formStatus.textContent = reference
          ? `Anfrage ${reference} wurde sicher übertragen. Eine Bestätigung folgt per E-Mail.`
          : 'Die Anfrage wurde sicher übertragen. Eine Bestätigung folgt per E-Mail.';
        return;
      }

      const shareFiles = [
        workflowValue() === 'template' ? fields.logo.files?.[0] : null,
        workflowValue() === 'upload' ? fields.templateFile.files?.[0] : null
      ].filter(Boolean);
      let canShareFiles = false;
      if (form.dataset.forceMail !== 'true'
        && shareFiles.length > 0
        && typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function') {
        try {
          canShareFiles = navigator.canShare({ files: shareFiles });
        } catch (_) {
          canShareFiles = false;
        }
      }
      if (canShareFiles) {
        try {
          await navigator.share({ title: inquiry.subject, text: inquiry.text, files: shareFiles });
          formStatus.textContent = 'Die Anfrage wurde an die gewählte App übergeben. Bitte Empfänger und Versand dort noch prüfen.';
          return;
        } catch (error) {
          if (error?.name === 'AbortError') {
            form.dataset.forceMail = 'true';
            formStatus.textContent = 'Teilen wurde abgebrochen. Beim nächsten Klick wird stattdessen ein E-Mail-Entwurf geöffnet.';
            return;
          }
        }
      }

      const mailto = `mailto:info@auto-lackierzentrum.de?subject=${encodeURIComponent(inquiry.subject)}&body=${encodeURIComponent(inquiry.text)}`;
      formStatus.textContent = inquiry.filesToAttach.length
        ? `Ihr E-Mail-Entwurf wird geöffnet. Bitte dort noch anhängen: ${inquiry.filesToAttach.join(', ')}.`
        : 'Ihr E-Mail-Programm wird mit der ausgefüllten Anfrage geöffnet.';
      window.location.href = mailto;
    } catch (_) {
      formError.textContent = 'Die direkte Übertragung ist momentan nicht erreichbar. Ihre Eingaben und Dateien bleiben erhalten; bitte versuchen Sie es erneut.';
      formError.classList.add('visible');
      formStatus.textContent = 'Es wurden keine Daten verworfen.';
    } finally {
      setTimeout(() => { submitButton.disabled = false; }, 1200);
    }
  });

  window.addEventListener('beforeunload', () => {
    cancelPdfTask();
    releasePreviewAssets();
  });

  const header = byId('site-header');
  const menuButton = byId('menu-button');
  const mainNav = byId('main-nav');
  const setMenu = open => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Navigation schließen' : 'Navigation öffnen');
    mainNav.classList.toggle('open', open);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mainNav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 18), { passive: true });
  const reveal = document.querySelectorAll('.reveal:not(.is-visible)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveal.forEach(element => observer.observe(element));
  } else {
    reveal.forEach(element => element.classList.add('is-visible'));
  }

  clearLogo();
  updateTemplateMode();
  updatePreview();
  setSide('front');
  setWizardStep(1);
})();
