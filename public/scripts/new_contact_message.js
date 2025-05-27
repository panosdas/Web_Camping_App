document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/new_contact_message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.redirect) {
          window.location.href = result.redirect;
          window.alert("Επιτυχής Αποστολή μηνύματος!")
        } else {
          console.error('Αποτυχία:', result.message);
        }

      } catch (error) {
        console.error('Σφάλμα αποστολής:', error);
      }
    });
  });