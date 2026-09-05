/* Guided service information. Selections stay in memory; no customer data is collected. */
(function () {
  'use strict';
  const steps = [
    { title: 'What are you noticing?', options: [['recurring', 'The clog keeps coming back', 'It clears, then slows or backs up again.'], ['slow', 'A drain is moving slowly', 'Water takes longer than usual to drain.'], ['roots', 'Roots or an older pipe', 'You want a closer look inside the line.'], ['backup', 'Water is backing up now', 'An urgent service conversation.']] },
    { title: 'How much of the property is affected?', options: [['one', 'One fixture', 'A sink, shower, tub, or floor drain.'], ['several', 'Several fixtures', 'More than one drain is affected.'], ['unsure', 'I’m not sure', 'Describe what you see when you contact us.']] },
    { title: 'How would you like to reach us?', options: [['call', 'Talk to Pro Jet', 'Open your phone app to call the team.'], ['quote', 'Request a quote', 'Continue to the website’s quote request page.']] }
  ];
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function init(root) {
    if (root.dataset.wizardReady) return;
    root.dataset.wizardReady = 'true'; root.classList.add('service-wizard');
    let step = 0; const answers = [];
    const rawBase = root.dataset.siteBase || '/';
    const base = /^\/(?!\/)[\w/-]*$/.test(rawBase) ? rawBase.replace(/\/?$/, '/') : '/';
    function link(text, href, cls) { const a = el('a', cls, text); a.href = href; return a; }
    function button(text, action, cls) { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', action); return b; }
    function cue() { if (window.ProJetCinema && typeof window.ProJetCinema.cue === 'function') window.ProJetCinema.cue('select'); }
    function urgent() {
      const n = el('aside', 'sw-urgent');
      n.append(el('strong', '', answers[0] === 'backup' ? 'Water backing up? Contact Pro Jet now.' : 'Active backup? Skip the guide and call.'), link('Call (816) 506-6243 ↗', 'tel:+18165066243'));
      return n;
    }
    function render(focus) {
      root.replaceChildren();
      const intro = el('header', 'sw-intro'); intro.append(el('p', 'sw-eyebrow', 'YOUR NEXT MOVE'), el('h2', '', 'Find your way to a clearer line.'), el('p', '', 'Three quick choices to prepare your conversation. This guide is service information, not a diagnosis or a booking.'));
      root.append(intro, urgent());
      const progress = el('ol', 'sw-progress'); progress.setAttribute('aria-label', 'Guide progress');
      ['Symptom', 'Scope', 'Contact'].forEach((name, i) => { const item = el('li', i < step ? 'is-complete' : '', String(i + 1).padStart(2, '0') + ' · ' + name); if (step === i) item.setAttribute('aria-current', 'step'); progress.append(item); }); root.append(progress);
      const panel = el('div', 'sw-panel'); root.append(panel);
      if (step < 3) {
        const fieldset = el('fieldset'); const legend = el('legend', '', steps[step].title); legend.tabIndex = -1; fieldset.append(legend);
        const options = el('div', 'sw-options');
        steps[step].options.forEach(([value, label, help]) => {
          const row = el('label', 'sw-option'); const input = el('input'); input.type = 'radio'; input.name = 'projet-service-step-' + step; input.value = value; input.checked = answers[step] === value;
          const copy = el('span', 'sw-option-copy'); copy.append(el('strong', '', label), el('span', '', help)); row.append(input, copy); options.append(row);
          input.addEventListener('change', () => { answers[step] = value; error.textContent = ''; cue(); if (step === 0) root.querySelector('.sw-urgent').replaceWith(urgent()); });
        }); fieldset.append(options); panel.append(fieldset);
        const error = el('p', 'sw-error'); error.setAttribute('role', 'alert'); panel.append(error);
        const actions = el('div', 'sw-actions');
        if (step) actions.append(button('← Back', () => { step--; render(true); }, 'sw-secondary'));
        actions.append(button(step === 2 ? 'See my next step →' : 'Continue →', () => { if (!answers[step]) { error.textContent = 'Choose an option to continue.'; options.querySelector('input').focus(); return; } step++; render(true); }, 'sw-primary')); panel.append(actions);
        if (focus) legend.focus();
      } else {
        const heading = el('h3', '', 'Your next step, made clear.'); heading.tabIndex = -1; panel.append(heading);
        const summary = el('dl', 'sw-summary'); answers.forEach((value, i) => { const row = el('div'); row.append(el('dt', '', ['What you see', 'Affected area', 'How to connect'][i]), el('dd', '', steps[i].options.find(o => o[0] === value)[1])); summary.append(row); }); panel.append(summary);
        const service = answers[0] === 'backup' ? ['Emergency drain service', 'emergency-drain-service/', 'Call the team about the active backup. Completing this guide does not notify a dispatcher.'] : answers[0] === 'roots' || answers[1] === 'unsure' ? ['Sewer camera inspection', 'camera-inspection/', 'A camera inspection helps identify what is inside the line so the team can discuss the appropriate next step.'] : answers[0] === 'recurring' ? ['Hydro jetting', 'hydro-jetting/', 'Hydro jetting cleans buildup from pipe walls. The team determines whether it is suitable for your line.'] : ['Drain clearing', 'drain-clearing/', 'Explore drain clearing for slow fixtures. Tell the team whether one or several drains are affected.'];
        const info = el('div', 'sw-service'); info.append(el('p', 'sw-eyebrow', 'A SERVICE TO DISCUSS'), el('h4', '', service[0]), el('p', '', service[2]), link('Explore ' + service[0].toLowerCase() + ' ↗', base + service[1])); panel.append(info);
        const actions = el('div', 'sw-actions'); actions.append(link(answers[0] === 'backup' ? 'Call Pro Jet now ↗' : answers[2] === 'call' ? 'Call Pro Jet ↗' : 'Continue to quote request →', answers[0] === 'backup' || answers[2] === 'call' ? 'tel:+18165066243' : base + 'request-quote/', 'sw-primary'), button('Edit choices', () => { step = 0; render(true); }, 'sw-secondary'), button('Start over', () => { answers.length = 0; step = 0; render(true); }, 'sw-secondary')); panel.append(actions, el('p', 'sw-note', 'Your choices have not been sent. Share this summary with the team. A quote request is not a confirmed appointment.'));
        if (focus) heading.focus();
      }
    }
    render(false);
  }
  function start() { document.querySelectorAll('[data-service-wizard]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
}());
