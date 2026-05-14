 <script>
    /* ─── FAVORIT/KONTAK refs + openContactModal + closeContactModal + popstate ─── */
    /* ─── FAVORIT / KONTAK ─── */
    var CONTACT_STORAGE_KEY = 'userteleponSMS';

    var contactHistoryPushed = false;

    function openContactModal() {
      var modal = document.getElementById('contactModal');
      if (!modal) return;
      modal.style.display = 'flex';
      modal.classList.add('show');
      refreshContactList();
      // Push history state agar tombol Back menutup modal favorit
      if (!contactHistoryPushed) {
        history.pushState({ contactModal: true }, '');
        contactHistoryPushed = true;
      }
    }

    function closeContactModal(opts) {
      var fromPopstate = opts && opts.fromPopstate;
      var modal = document.getElementById('contactModal');
      if (!modal) return;
      modal.style.display = 'none';
      modal.classList.remove('show');
      if (contactHistoryPushed && !fromPopstate) {
        contactHistoryPushed = false;
        history.back();
      } else {
        contactHistoryPushed = false;
      }
    }

    window.addEventListener('popstate', function () {
      var modal = document.getElementById('contactModal');
      if (modal && modal.classList.contains('show')) {
        closeContactModal({ fromPopstate: true });
      }
    });
  </script>

  <script>
    /* ─── refreshContactList ─── */
    function refreshContactList() {
      var container = document.getElementById('modalContactList');
      var deleteAllBtn = document.querySelector('.delete-all-btn');
      var contacts = [];
      var raw;
      var html = '';
      var i;
      var c;
      var safeNumber;

      if (!container) return;

      raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      try {
        contacts = raw ? JSON.parse(raw) : [];
      } catch (e) {
        contacts = [];
      }

      console.log('Data kontak tersimpan:', JSON.stringify(contacts, null, 2));

      if (contacts.length > 0) {
        for (i = 0; i < contacts.length; i++) {
          c = contacts[i] || {};
          safeNumber = String(c.number || '').replace(/'/g, "\\'");
          html += '<div class="contact-item">' +
            '<div onclick="selectContact(\'' + safeNumber + '\')" style="flex:1;">' +
              '<strong>' + String(c.name || '') + '</strong>' +
              '<div>' + String(c.number || '') + '</div>' +
            '</div>' +
            '<button type="button" class="delete-btn" onclick="deleteContact(' + i + ')">Hapus</button>' +
          '</div>';
        }
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>Tidak ada daftar kontak.</p>';
      }

      if (deleteAllBtn) {
        deleteAllBtn.style.display = contacts.length > 1 ? 'block' : 'none';
      }
    }
  </script>

  <script>
    /* ─── deleteContact ─── */
    function deleteContact(index) {
      var contacts = [];
      var raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      try {
        contacts = raw ? JSON.parse(raw) : [];
      } catch (e) {
        contacts = [];
      }

      if (contacts.length > index) {
        contacts.splice(index, 1);
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contacts));
        refreshContactList();
      }
    }
  </script>

  <script>
    /* ─── showConfirmModal ─── */
    /* ─── MODAL KONFIRMASI MODERN ─── */
    function showConfirmModal(opts) {
      opts = opts || {};
      var modal = document.getElementById('confirmModal');
      if (!modal) {
        if (confirm(opts.message || 'Apakah Anda yakin?')) {
          if (typeof opts.onConfirm === 'function') opts.onConfirm();
        }
        return;
      }
      var titleEl   = document.getElementById('confirmTitle');
      var msgEl     = document.getElementById('confirmMessage');
      var okBtn     = document.getElementById('confirmOkBtn');
      var cancelBtn = document.getElementById('confirmCancelBtn');

      if (titleEl) titleEl.textContent = opts.title || 'Konfirmasi';
      if (msgEl)   msgEl.textContent   = opts.message || 'Apakah Anda yakin?';
      if (okBtn)   okBtn.textContent   = opts.okText || 'Hapus';
      if (cancelBtn) cancelBtn.textContent = opts.cancelText || 'Batal';

      function close() {
        modal.classList.remove('show');
        modal.style.display = 'none';
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        modal.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKey);
      }
      function onOk() {
        close();
        if (typeof opts.onConfirm === 'function') opts.onConfirm();
      }
      function onCancel() {
        close();
        if (typeof opts.onCancel === 'function') opts.onCancel();
      }
      function onBackdrop(e) { if (e.target === modal) onCancel(); }
      function onKey(e) { if (e.key === 'Escape') onCancel(); }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      modal.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKey);

      modal.style.display = 'flex';
      requestAnimationFrame(function () { modal.classList.add('show'); });
    }
    window.showConfirmModal = showConfirmModal;
  </script>

  <script>
    /* ─── deleteAllContacts ─── */
    function deleteAllContacts() {
      var raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      var contacts = [];
      try { contacts = raw ? JSON.parse(raw) : []; } catch (e) { contacts = []; }
      if (!contacts.length) return;

      showConfirmModal({
        title: 'Hapus Semua Kontak?',
        message: 'Semua ' + contacts.length + ' kontak favorit yang tersimpan akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.',
        okText: 'Hapus Semua',
        cancelText: 'Batal',
        onConfirm: function () {
          localStorage.removeItem(CONTACT_STORAGE_KEY);
          refreshContactList();
          if (typeof showToast === 'function') showToast('Semua kontak favorit dihapus');
        }
      });
    }
  </script>

  <script>
    /* ─── selectContact ─── */
    function selectContact(number) {
      var nomorHPInput = document.getElementById('phoneNumber');
      if (!nomorHPInput) return;
      nomorHPInput.value = number;
      nomorHPInput.dispatchEvent(new Event('input'));
      if (typeof formatNomorHP === 'function') formatNomorHP(nomorHPInput);
      if (typeof handlePhoneChange === 'function') handlePhoneChange();
      closeContactModal();
    }
  </script>

  <script>
    /* ─── window exports + contactForm submit + contactModal click + init ─── */
    window.openContactModal = openContactModal;
    window.closeContactModal = closeContactModal;
    window.deleteContact = deleteContact;
    window.deleteAllContacts = deleteAllContacts;
    window.selectContact = selectContact;

    var contactFormEl = document.getElementById('contactForm');
    if (contactFormEl) {
      contactFormEl.addEventListener('submit', function (e) {
        var name = document.getElementById('contactName').value.trim();
        var number = document.getElementById('contactNumber').value.trim();
        var contacts = [];
        var raw = localStorage.getItem(CONTACT_STORAGE_KEY);

        e.preventDefault();

        if (!name || !number) {
          alert('Nama dan Nomor HP tidak boleh kosong!');
          return;
        }

        if (!/^\d+$/.test(number)) {
          alert('Nomor HP hanya boleh mengandung angka');
          return;
        }

        try {
          contacts = raw ? JSON.parse(raw) : [];
        } catch (err) {
          contacts = [];
        }

        contacts.push({
          name: name,
          number: number
        });
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contacts));

        console.log('Kontak baru:', JSON.stringify({ name: name, number: number }));

        this.reset();
        refreshContactList();
      });
    }

    var contactModalEl = document.getElementById('contactModal');
    if (contactModalEl) {
      contactModalEl.addEventListener('click', function (e) {
        if (e.target === contactModalEl) closeContactModal();
      });
    }

    document.addEventListener('DOMContentLoaded', refreshContactList);
    refreshContactList();
  </script>

  <script>
    /* ─── INFO MODAL (open/close/popstate/listeners) ─── */
    /* ─── INFO MODAL ─── */
    var infoHistoryPushed = false;
    function openInfoModal() {
      var modal = document.getElementById('infoModal');
      if (!modal) return;
      modal.style.display = 'flex';
      requestAnimationFrame(function () { modal.classList.add('show'); });
      document.body.style.overflow = 'hidden';
      if (!infoHistoryPushed) {
        history.pushState({ infoModal: true }, '');
        infoHistoryPushed = true;
      }
    }
    function closeInfoModal(opts) {
      var fromPopstate = opts && opts.fromPopstate;
      var modal = document.getElementById('infoModal');
      if (!modal) return;
      modal.classList.remove('show');
      setTimeout(function () { modal.style.display = 'none'; }, 200);
      document.body.style.overflow = '';
      if (infoHistoryPushed && !fromPopstate) {
        infoHistoryPushed = false;
        history.back();
      } else {
        infoHistoryPushed = false;
      }
    }
    window.openInfoModal = openInfoModal;
    window.closeInfoModal = closeInfoModal;

    window.addEventListener('popstate', function () {
      var m = document.getElementById('infoModal');
      if (m && m.classList.contains('show')) {
        closeInfoModal({ fromPopstate: true });
      }
    });

    var infoModalEl = document.getElementById('infoModal');
    if (infoModalEl) {
      infoModalEl.addEventListener('click', function (e) {
        if (e.target === infoModalEl) closeInfoModal();
      });
      var infoCloseBtn = document.getElementById('infoCloseBtn');
      if (infoCloseBtn) infoCloseBtn.addEventListener('click', closeInfoModal);
      var infoOkBtn = document.getElementById('infoOkBtn');
      if (infoOkBtn) infoOkBtn.addEventListener('click', closeInfoModal);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var m = document.getElementById('infoModal');
        if (m && m.style.display === 'flex') closeInfoModal();
      }
    });
  </script>

  <script>
    /* ─── STICKY OPERATOR CARD ─── */
    /* Penanda visual saat operator-card menempel di atas (scroll-based, anti-jitter) */
    (function () {
      var card = document.querySelector('.operator-card');
      if (!card) return;
      var ticking = false;
      function update() {
        var rect = card.getBoundingClientRect();
        // Saat top card menyentuh/tertahan di posisi 0 (atau di atasnya)
        var stuck = rect.top <= 0;
        card.classList.toggle('is-stuck', stuck);
        ticking = false;
      }
      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
      update();
    })();
  </script>
