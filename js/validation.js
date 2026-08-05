/* ============================================================
   STACKLY — validation.js
   Rule 1: first/last name accept letters & spaces only
   Rule 2: every email field must be a valid email address
   Rule 3: passwords need 8+ chars, with show/hide toggle
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const NAME_RE  = /^[A-Za-z][A-Za-z\s'-]{1,}$/;
  const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function setError(field, msg){
    field.classList.add('has-error');
    const err = field.querySelector('.field-error');
    if (err && msg) err.textContent = msg;
    const input = field.querySelector('input, textarea');
    input.classList.add('invalid'); input.classList.remove('valid');
  }
  function clearError(field){
    field.classList.remove('has-error');
    const input = field.querySelector('input, textarea');
    input.classList.remove('invalid'); input.classList.add('valid');
  }

  /* ---------------------------------------------------------
     NAME FIELDS — letters only
  --------------------------------------------------------- */
  document.querySelectorAll('input[data-rule="name"]').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^A-Za-z\s'-]/g, '');
    });
    input.addEventListener('blur', () => {
      const field = input.closest('.field');
      if (!input.value.trim()){ setError(field, 'This field is required.'); return; }
      if (!NAME_RE.test(input.value.trim())){
        setError(field, 'Only letters are allowed — no numbers or symbols.');
      } else clearError(field);
    });
  });

  /* ---------------------------------------------------------
     EMAIL FIELDS — must be valid, e.g. name@gmail.com
  --------------------------------------------------------- */
  document.querySelectorAll('input[data-rule="email"]').forEach(input => {
    input.addEventListener('blur', () => {
      const field = input.closest('.field');
      if (!input.value.trim()){ setError(field, 'Email address is required.'); return; }
      if (!EMAIL_RE.test(input.value.trim())){
        setError(field, 'Enter a valid email address, e.g. name@gmail.com');
      } else clearError(field);
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid') && EMAIL_RE.test(input.value.trim())){
        clearError(input.closest('.field'));
      }
    });
  });

  /* ---------------------------------------------------------
     PASSWORD FIELDS — min 8 chars + show/hide + strength meter
  --------------------------------------------------------- */
  document.querySelectorAll('input[data-rule="password"]').forEach(input => {
    const field = input.closest('.field');
    const bars = field.querySelectorAll('.pw-strength i');

    input.addEventListener('input', () => {
      const val = input.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/\d/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      bars.forEach((bar,i) => bar.classList.toggle('on', i < score));

      if (val.length && val.length < 8){
        setError(field, 'Password must be at least 8 characters.');
      } else if (val.length >= 8){
        clearError(field);
      }
    });

    input.addEventListener('blur', () => {
      if (!input.value){ setError(field, 'Password is required.'); }
      else if (input.value.length < 8){ setError(field, 'Password must be at least 8 characters.'); }
    });
  });

  /* show / hide password toggle */
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.pw-wrap').querySelector('input');
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? eyeOpen() : eyeClosed();
    });
  });
  function eyeOpen(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
  function eyeClosed(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M7.4 7.6C4.7 9.1 3 12 3 12s4 7 11 7c1.9 0 3.5-.5 4.9-1.2M16.7 16.8C19.4 15.2 21 12 21 12s-2-3.6-5.6-5.6"/></svg>`;
  }

  /* ---------------------------------------------------------
     GENERIC FORM SUBMIT HANDLER — contact / login / signup
  --------------------------------------------------------- */
  document.querySelectorAll('form[data-validate]').forEach(form => {
    // if the form contains auth mode buttons, wire clicks to set hidden input
    const modeRow = form.querySelector('.auth-mode-row');
    if (modeRow){
      modeRow.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          modeRow.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          let hidden = form.querySelector('input[name="authMode"]');
          if (!hidden){ hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = 'authMode'; form.prepend(hidden); }
          hidden.value = btn.classList.contains('admin-mode') ? 'admin' : 'public';
          const err = modeRow.querySelector('.mode-error'); if (err) err.remove();
        });
      });
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      // require selecting Admin/Public if the form includes the mode selector
      if (modeRow){
        const hidden = form.querySelector('input[name="authMode"]');
        if (!hidden || !hidden.value){
          valid = false;
          if (!modeRow.querySelector('.mode-error')){
            const err = document.createElement('div'); err.className='mode-error'; err.textContent = 'Select Admin or Public'; modeRow.appendChild(err);
          }
        }
      }

      form.querySelectorAll('input[data-rule="name"]').forEach(input => {
        const field = input.closest('.field');
        if (!NAME_RE.test(input.value.trim())){ setError(field, input.value.trim() ? 'Only letters are allowed.' : 'This field is required.'); valid = false; }
        else clearError(field);
      });

      form.querySelectorAll('input[data-rule="email"]').forEach(input => {
        const field = input.closest('.field');
        const emailValue = input.value.trim();

        if (!emailValue){
          setError(field, 'Email address is required.');
          valid = false;
        } else if (!EMAIL_RE.test(emailValue)){
          setError(field, 'Enter a valid email address, e.g. name@gmail.com');
          valid = false;
        } else {
          clearError(field);
        }
      });

      form.querySelectorAll('input[data-rule="password"]').forEach(input => {
        const field = input.closest('.field');
        if (input.value.length < 8){ setError(field, 'Password must be at least 8 characters.'); valid = false; }
        else clearError(field);
      });

      form.querySelectorAll('input[required][data-rule="text"], textarea[required][data-rule="text"]').forEach(input => {
        const field = input.closest('.field');
        if (!input.value.trim()){ setError(field, 'This field is required.'); valid = false; }
        else clearError(field);
      });

      const confirmField = form.querySelector('input[data-rule="confirm-password"]');
      if (confirmField){
        const pw = form.querySelector('input[data-rule="password"]');
        const field = confirmField.closest('.field');
        if (confirmField.value !== pw.value || !confirmField.value){
          setError(field, 'Passwords do not match.'); valid = false;
        } else clearError(field);
      }

      const terms = form.querySelector('input[data-rule="terms"]');
      if (terms && !terms.checked){ valid = false; terms.closest('.checkbox-row').style.color = 'var(--err)'; }

      if (!valid){
        const firstError = form.querySelector('.has-error');
        firstError?.scrollIntoView({ behavior:'smooth', block:'center' });
        return;
      }

      const success = form.querySelector('.form-success');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Please wait…'; }

      setTimeout(() => {
        const redirect = form.dataset.redirect;
        let emailToSave = '';
        if (redirect) {
          const emailInput = form.querySelector('input[data-rule="email"]');
          emailToSave = emailInput?.value.trim() || '';
        }

        if (success){
          success.classList.add('show');
          form.reset();
          form.querySelectorAll('.pw-strength i').forEach(b => b.classList.remove('on'));
        }
        if (submitBtn){
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.label || 'Submit';
        }
        if (redirect) {
          if (emailToSave) {
            localStorage.setItem('stacklyEmail', emailToSave);
          }
          const authMode = form.querySelector('input[name="authMode"]')?.value;
          const nextPage = authMode === 'admin' ? 'admin.html' : redirect;
          setTimeout(() => location.href = nextPage, 900);
        }
      }, 900);
    });
  });

});
